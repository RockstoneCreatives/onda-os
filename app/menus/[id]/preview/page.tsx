'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SECTION_ORDER, isHierarchical } from '@/constants/menu-sections'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']
type MenuSection = Database['public']['Tables']['menu_sections']['Row']

interface Section extends MenuSection {
  wines: (Wine & { menu_item_id: string; sort_order: number })[]
}

interface Menu {
  id: string
  title: string
  sections: Section[]
}

export default function MenuPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

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

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/menus/${menuId}/pdf`)
      if (!response.ok) throw new Error('Failed to download PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${menu?.title || 'menu'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF downloaded')
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to download PDF')
      console.error(error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red mx-auto"></div>
          <p className="mt-4 text-onda-500">Loading menu preview...</p>
        </div>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-onda-600 mb-4">Menu not found</p>
          <Link href="/menus" className="text-onda-red hover:opacity-80 font-medium">
            Back to Menus
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-onda-200 px-8 py-4 flex justify-between items-center print:hidden">
        <Link href={`/menus/${menuId}`} className="text-onda-red font-medium hover:opacity-80">
          ← Back to Edit
        </Link>
        <h1 className="text-2xl font-bold text-onda-primary">{menu.title}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-onda-200 text-onda-700 rounded-lg text-sm font-medium hover:bg-onda-50 transition"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2 bg-onda-red text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {downloading ? '⬇️ Downloading...' : '⬇️ PDF'}
          </button>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {menu.sections.length === 0 ? (
          <p className="text-center text-onda-500">No wines in this menu</p>
        ) : (
          menu.sections.map((section) => {
            // Resolve section display name to key for hierarchical check
            const sectionKey = SECTION_ORDER.find((s) => s.display === section.name)?.key
            const hierarchical = sectionKey ? isHierarchical(sectionKey) : false

            return (
              <div key={section.id} className="mb-12">
                {/* Section Header */}
                <h2 className="text-3xl font-bold text-onda-red uppercase mb-6">
                  {section.name}
                </h2>

                {hierarchical ? (
                  // Hierarchical: Group by country, then region
                  <div className="space-y-8">
                    {Array.from(
                      new Map(
                        section.wines.map((w) => [w.country, w])
                      ).entries()
                    ).map(([country, firstWine]) => {
                      const countryWines = section.wines.filter((w) => w.country === country)
                      const regionGroups = Array.from(
                        new Map(
                          countryWines.map((w) => [w.region || 'No Region', w])
                        ).entries()
                      )

                      return (
                        <div key={country}>
                          <h3 className="text-xl font-semibold text-onda-primary mb-4">
                            {country}
                          </h3>
                          <div className="space-y-6 pl-4">
                            {regionGroups.map(([region, firstRegionWine]) => {
                              const regionWines = countryWines.filter(
                                (w) => (w.region || 'No Region') === region
                              )

                              return (
                                <div key={region}>
                                  {region !== 'No Region' && (
                                    <h4 className="text-sm font-medium text-onda-600 mb-3 italic">
                                      {region}
                                    </h4>
                                  )}
                                  <div className="space-y-3 pl-4">
                                    {regionWines.map((wine) => (
                                      <div
                                        key={wine.menu_item_id}
                                        className="flex justify-between items-baseline gap-4"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm">
                                            <span className="font-semibold">{wine.producer}</span>
                                            {wine.name && ` – ${wine.name}`}
                                            {wine.vintage && ` ${wine.vintage}`}
                                            {wine.grapes && (
                                              <span className="text-onda-600 italic"> – {wine.grapes}</span>
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex gap-6 text-sm font-medium text-onda-primary">
                                          {wine.glass_price && (
                                            <span className="whitespace-nowrap">€{wine.glass_price.toFixed(2)}</span>
                                          )}
                                          {wine.sale_price && (
                                            <span className="whitespace-nowrap">€{wine.sale_price.toFixed(2)}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Non-hierarchical: Flat list
                  <div className="space-y-3">
                    {section.wines.map((wine) => (
                      <div key={wine.menu_item_id} className="flex justify-between items-baseline gap-4">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{wine.producer}</span>
                            {wine.name && ` – ${wine.name}`}
                            {wine.vintage && ` ${wine.vintage}`}
                            {wine.grapes && (
                              <span className="text-onda-600 italic"> – {wine.grapes}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-6 text-sm font-medium text-onda-primary">
                          {wine.glass_price && (
                            <span className="whitespace-nowrap">€{wine.glass_price.toFixed(2)}</span>
                          )}
                          {wine.sale_price && (
                            <span className="whitespace-nowrap">€{wine.sale_price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\:hidden {
            display: none !important;
          }
          .ml-64 {
            margin-left: 0 !important;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  )
}
