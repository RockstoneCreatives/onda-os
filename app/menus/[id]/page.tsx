'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
      // Swap sort orders
      const wine1 = section.wines[wineIndex]
      const wine2 = section.wines[newIndex]

      await Promise.all([
        supabase.from('menu_items').update({ sort_order: newIndex }).eq('id', wine1.menu_item_id),
        supabase.from('menu_items').update({ sort_order: wineIndex }).eq('id', wine2.menu_item_id),
      ])

      // Update local state
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Menu not found</p>
          <Link href="/menus" className="text-onda-accent hover:underline font-medium">
            Back to Menus
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-onda-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/menus" className="text-onda-accent font-bold text-lg hover:opacity-80">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Menu Details</h1>
          <div className="flex gap-4">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              📥 Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Title Editor */}
        <div className="bg-white rounded-lg border border-onda-border p-6 mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Menu Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
            <button
              onClick={handleUpdateTitle}
              disabled={saving}
              className="px-4 py-2 bg-onda-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {menu.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg border border-onda-border p-8">
              <h2 className="text-2xl font-bold text-onda-accent mb-1">{section.name}</h2>
              <p className="text-sm text-slate-600 mb-6">
                {section.wines.length} {section.wines.length === 1 ? 'wine' : 'wines'}
              </p>

              <div className="space-y-3">
                {section.wines.map((wine, idx) => (
                  <div key={wine.id} className="flex items-start gap-4 pb-3 border-b border-onda-border last:border-0">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'up')}
                        disabled={idx === 0}
                        className="px-2 py-1 text-slate-600 hover:text-onda-accent disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'down')}
                        disabled={idx === section.wines.length - 1}
                        className="px-2 py-1 text-slate-600 hover:text-onda-accent disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {wine.producer} – {wine.name} {wine.vintage}
                      </p>
                      <p className="text-sm text-slate-600">{wine.grapes}</p>
                    </div>

                    <div className="text-right text-sm font-medium whitespace-nowrap">
                      {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                      <div>B: €{wine.sale_price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Export Button */}
        <div className="mt-12 pt-8 border-t border-onda-border">
          <button
            onClick={handleExportPDF}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-lg"
          >
            📥 Download Menu as PDF
          </button>
        </div>
      </main>
    </div>
  )
}
