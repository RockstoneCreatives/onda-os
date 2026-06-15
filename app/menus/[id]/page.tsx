'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'
import { SECTION_ORDER } from '@/constants/menu-sections'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']
type MenuSection = Database['public']['Tables']['menu_sections']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface Section extends MenuSection {
  wines: (Wine & { menu_item_id: string; sort_order: number })[]
}

interface Menu {
  id: string
  title: string
  sections: Section[]
}

export default function MenuDetailPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuTitle, setMenuTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        // Fetch menu
        const { data: menuData, error: menuError } = await supabase
          .from('menus')
          .select('*')
          .eq('id', menuId)
          .single()

        if (menuError || !menuData) {
          router.push('/menus')
          return
        }

        // Fetch sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('menu_sections')
          .select('*')
          .eq('menu_id', menuId)
          .order('sort_order')

        if (sectionsError) throw sectionsError

        // Fetch items and wines
        const sectionsWithWines: Section[] = await Promise.all(
          (sectionsData || []).map(async (section) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('menu_items')
              .select('*')
              .eq('section_id', section.id)
              .order('sort_order')

            if (itemsError) throw itemsError

            const wines = await Promise.all(
              (itemsData || []).map(async (item) => {
                const { data: wineData, error: wineError } = await supabase
                  .from('wines')
                  .select('*')
                  .eq('id', item.wine_id)
                  .single()

                if (wineError) throw wineError
                return { ...wineData, menu_item_id: item.id, sort_order: item.sort_order }
              })
            )

            return { ...section, wines }
          })
        )

        // Sort sections by fixed order
        const sortedSections = SECTION_ORDER.map((s) =>
          sectionsWithWines.find((sec) => sec.name === s.display)
        ).filter(Boolean) as Section[]

        setMenu({
          id: menuData.id,
          title: menuData.title,
          sections: sortedSections,
        })
        setMenuTitle(menuData.title)
      } catch (err) {
        const error = err as Error
        toast.error('Failed to load menu')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuId, router])

  const handleMoveWine = async (sectionId: string, wineIndex: number, direction: 'up' | 'down') => {
    if (!menu) return

    const section = menu.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newIndex = direction === 'up' ? wineIndex - 1 : wineIndex + 1
    if (newIndex < 0 || newIndex >= section.wines.length) return

    try {
      const wine1 = section.wines[wineIndex]
      const wine2 = section.wines[newIndex]

      await Promise.all([
        supabase.from('menu_items').update({ sort_order: newIndex }).eq('id', wine1.menu_item_id),
        supabase.from('menu_items').update({ sort_order: wineIndex }).eq('id', wine2.menu_item_id),
      ])

      const newSections = menu.sections.map((s) => {
        if (s.id !== sectionId) return s
        const newWines = [...s.wines]
        ;[newWines[wineIndex], newWines[newIndex]] = [newWines[newIndex], newWines[wineIndex]]
        return { ...s, wines: newWines }
      })

      setMenu({ ...menu, sections: newSections })
      toast.success('Wine reordered')
    } catch (err) {
      const error = err as Error
      toast.error('Failed to reorder wine')
      console.error(error)
    }
  }

  const handleUpdateTitle = async () => {
    if (!menuTitle.trim()) {
      toast.error('Enter a menu title')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('menus').update({ title: menuTitle }).eq('id', menuId)

      if (error) throw error

      if (menu) {
        setMenu({ ...menu, title: menuTitle })
      }

      toast.success('Menu title updated')
    } catch (err) {
      const error = err as Error
      toast.error('Failed to update menu')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/menus/${menuId}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ONDA-Menu-${menu?.title || 'menu'}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF downloaded')
    } catch (err) {
      const error = err as Error
      toast.error('Failed to generate PDF')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Nav currentPage="menus" />
        <main className="pt-24 text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
          <p className="mt-4 text-onda-muted font-condensed">Loading menu...</p>
        </main>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-white">
        <Nav currentPage="menus" />
        <main className="pt-24 max-w-6xl mx-auto px-6 text-center">
          <p className="text-onda-text font-condensed mb-4">Menu not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav currentPage="menus" />

      <main className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        <div className="mb-8 space-y-4">
          <label className="block font-condensed font-bold uppercase text-xs text-onda-muted">
            Menu Title
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              disabled={saving}
              className="flex-1 px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
            />
            <button
              onClick={handleUpdateTitle}
              disabled={saving}
              className="px-4 py-2 bg-onda-accent text-white font-condensed font-bold uppercase text-sm hover:opacity-85 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 border border-onda-border text-onda-accent font-condensed font-bold uppercase text-sm hover:bg-onda-surface transition"
            >
              ↓ PDF
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {menu.sections.map((section) => (
            <div key={section.id} className="border border-onda-border">
              <h2 className="font-condensed font-bold uppercase text-onda-accent text-2xl px-4 py-3 border-b border-onda-border bg-white">
                {section.name}
              </h2>
              <div className="px-4 py-3 border-b border-onda-border text-xs font-condensed text-onda-muted">
                {section.wines.length} wine{section.wines.length !== 1 ? 's' : ''}
              </div>

              <div className="divide-y divide-onda-border">
                {section.wines.map((wine, idx) => (
                  <div key={wine.id} className="flex items-start gap-3 px-4 py-3 hover:bg-onda-surface transition">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'up')}
                        disabled={idx === 0}
                        className="px-2 py-1 text-onda-text hover:text-onda-accent disabled:opacity-30 disabled:cursor-not-allowed font-condensed font-bold"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'down')}
                        disabled={idx === section.wines.length - 1}
                        className="px-2 py-1 text-onda-text hover:text-onda-accent disabled:opacity-30 disabled:cursor-not-allowed font-condensed font-bold"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-condensed font-bold text-onda-text">
                        {wine.producer} – {wine.name} {wine.vintage}
                      </p>
                      <p className="text-sm font-condensed text-onda-muted">{wine.grapes}</p>
                    </div>

                    <div className="text-right text-sm font-condensed text-onda-muted whitespace-nowrap">
                      {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                      <div>B: €{wine.sale_price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
