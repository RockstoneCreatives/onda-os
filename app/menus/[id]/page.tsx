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
      <div className="ml-64 min-h-screen bg-onda-50">
        <div className="border-b border-onda-200 bg-white">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-onda-900">Menu</h1>
          </div>
        </div>
        <main className="p-8 text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red"></div>
          </div>
          <p className="mt-4 text-onda-500">Loading menu...</p>
        </main>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50">
        <div className="border-b border-onda-200 bg-white">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-onda-900">Menu</h1>
          </div>
        </div>
        <main className="p-8 text-center">
          <p className="text-onda-600">Menu not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-onda-900">Menu</h1>
          <p className="text-onda-500 mt-1">Edit and manage your menu.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-4xl">
        {/* Menu Title Section */}
        <div className="bg-white rounded-lg border border-onda-200 p-6 shadow-xs mb-8">
          <label className="block text-sm font-medium text-onda-700 mb-3">
            Menu Title
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              disabled={saving}
              className="flex-1 px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
            />
            <button
              onClick={handleUpdateTitle}
              disabled={saving}
              className="px-4 py-2 bg-onda-red text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <Link
              href={`/menus/${menuId}/preview`}
              className="px-4 py-2 border border-onda-200 text-onda-700 rounded-lg font-medium text-sm hover:bg-onda-50 transition inline-block"
            >
              👁️ Preview
            </Link>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {menu.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg border border-onda-200 overflow-hidden shadow-xs">
              <div className="bg-onda-50 border-b border-onda-200 px-6 py-4">
                <h2 className="font-semibold text-lg text-onda-900">{section.name}</h2>
                <p className="text-xs text-onda-500 mt-1">
                  {section.wines.length} wine{section.wines.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="divide-y divide-onda-200">
                {section.wines.map((wine, idx) => (
                  <div key={wine.id} className="flex items-start gap-4 px-6 py-4 hover:bg-onda-50 transition">
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'up')}
                        disabled={idx === 0}
                        className="px-2 py-0.5 text-onda-600 hover:text-onda-red disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveWine(section.id, idx, 'down')}
                        disabled={idx === section.wines.length - 1}
                        className="px-2 py-0.5 text-onda-600 hover:text-onda-red disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-onda-900">
                        {wine.producer} – {wine.name} {wine.vintage}
                      </p>
                      <p className="text-sm text-onda-500 mt-0.5">{wine.grapes}</p>
                    </div>

                    <div className="text-right text-sm text-onda-600 whitespace-nowrap flex flex-col items-end gap-1">
                      {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                      <div>B: €{wine.sale_price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
