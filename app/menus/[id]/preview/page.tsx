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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center print:hidden">
        <Link href={`/menus/${menuId}`} className="text-onda-red font-medium hover:opacity-80">
          ← Back to Edit
        </Link>
        <h1 className="text-2xl font-bold text-black">{menu.title}</h1>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-onda-red text-white rounded text-sm font-medium hover:opacity-90 transition"
        >
          ⬇️ Save as PDF
        </button>
      </div>

      {/* Menu Content - Print optimized */}
      <div className="mx-auto" style={{ maxWidth: '210mm', fontSize: '10pt', lineHeight: '1.4', padding: '20mm' }}>
        {menu.sections.length === 0 ? (
          <p className="text-center text-gray-500">No wines in this menu</p>
        ) : (
          menu.sections.map((section, sectionIndex) => {
            // Resolve section display name to key for hierarchical check
            const sectionKey = SECTION_ORDER.find((s) => s.display === section.name)?.key
            const hierarchical = sectionKey ? isHierarchical(sectionKey) : false

            return (
              <div key={section.id} className="mb-16 print:mb-8 print:break-inside-avoid">
                {/* Section Header with price header */}
                <div className="flex justify-between items-baseline" style={{ marginBottom: '12px', marginTop: sectionIndex === 0 ? '0' : '24px' }}>
                  <h2 className="font-bold text-black" style={{ fontSize: '22pt', lineHeight: '1.1' }}>
                    {section.name}
                  </h2>
                  <div className="text-gray-600 font-medium" style={{ fontSize: '9pt' }}>glass/bottle</div>
                </div>

                {hierarchical ? (
                  // Hierarchical: Group by country, then region
                  <div className="space-y-6 print:space-y-4">
                    {Array.from(
                      new Map(
                        section.wines.map((w) => [w.country, w])
                      ).entries()
                    ).map(([country, firstWine]) => {
                      const countryWines = section.wines.filter((w) => w.country === country)
                      const regionGroups = Array.from(
                        new Map(
                          countryWines.map((w) => [w.region || '', w])
                        ).entries()
                      )

                      return (
                        <div key={country} style={{ marginTop: '12px', marginBottom: '6px' }}>
                          {/* Country Header */}
                          <h3 className="font-bold text-black" style={{ fontSize: '10pt', marginBottom: '6px' }}>
                            {country}
                          </h3>
                          <div className="space-y-1" style={{ marginBottom: '12px' }}>
                            {regionGroups.map(([region, firstRegionWine]) => {
                              const regionWines = countryWines.filter(
                                (w) => (w.region || '') === region
                              )

                              return (
                                <div key={region} style={{ marginBottom: '12px' }}>
                                  {/* Region subheader */}
                                  {region && (
                                    <h4 className="italic text-black" style={{ fontSize: '10pt', marginBottom: '4px' }}>
                                      {region}
                                    </h4>
                                  )}
                                  <div className="space-y-1"  style={{ marginBottom: '8px' }}>
                                    {regionWines.map((wine) => (
                                      <div
                                        key={wine.menu_item_id}
                                        className="flex justify-between items-baseline gap-6"
                                        style={{ marginBottom: '5px', fontSize: '10pt' }}
                                      >
                                        <div className="flex-1">
                                          <p className="text-black leading-tight" style={{ fontSize: '10pt' }}>
                                            <span>{wine.producer}</span>
                                            {wine.name && ` – ${wine.name}`}
                                            {wine.vintage && ` ${wine.vintage}`}
                                            {wine.grapes && (
                                              <span className="italic" style={{ color: '#666' }}> – {wine.grapes}</span>
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex gap-12 text-black whitespace-nowrap" style={{ fontSize: '10pt', gap: '24px' }}>
                                          {wine.glass_price ? (
                                            <>
                                              <span style={{ width: '40px', textAlign: 'right' }}>{wine.glass_price.toFixed(0)}</span>
                                              <span style={{ width: '40px', textAlign: 'right' }}>{wine.sale_price?.toFixed(0)}</span>
                                            </>
                                          ) : (
                                            <span style={{ width: '80px', textAlign: 'right' }}>{wine.sale_price?.toFixed(0)}</span>
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
                  // Non-hierarchical: Region groups with flat wines
                  <div className="space-y-1" style={{ marginBottom: '12px' }}>
                    {Array.from(
                      new Map(
                        section.wines.map((w) => [w.country || w.region || 'Other', w])
                      ).entries()
                    ).map(([regionCountry, firstWine]) => {
                      const regionWines = section.wines.filter(
                        (w) => (w.country || w.region || 'Other') === regionCountry
                      )

                      return (
                        <div key={regionCountry} style={{ marginBottom: '12px' }}>
                          {/* Region/Country header for non-hierarchical */}
                          <h4 className="italic text-black" style={{ fontSize: '10pt', marginBottom: '4px' }}>
                            {regionCountry}
                          </h4>
                          <div className="space-y-1" style={{ marginBottom: '8px' }}>
                            {regionWines.map((wine) => (
                              <div
                                key={wine.menu_item_id}
                                className="flex justify-between items-baseline gap-6"
                                style={{ marginBottom: '5px', fontSize: '10pt' }}
                              >
                                <div className="flex-1">
                                  <p className="text-black leading-tight" style={{ fontSize: '10pt' }}>
                                    <span>{wine.producer}</span>
                                    {wine.name && ` – ${wine.name}`}
                                    {wine.vintage && ` ${wine.vintage}`}
                                    {wine.grapes && (
                                      <span className="italic" style={{ color: '#666' }}> – {wine.grapes}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex gap-12 text-black whitespace-nowrap" style={{ fontSize: '10pt', gap: '24px' }}>
                                  {wine.glass_price ? (
                                    <>
                                      <span style={{ width: '40px', textAlign: 'right' }}>{wine.glass_price.toFixed(0)}</span>
                                      <span style={{ width: '40px', textAlign: 'right' }}>{wine.sale_price?.toFixed(0)}</span>
                                    </>
                                  ) : (
                                    <span style={{ width: '80px', textAlign: 'right' }}>{wine.sale_price?.toFixed(0)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Onda Logo at bottom */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #d1d5db',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <svg
            width="120"
            height="60"
            viewBox="0 0 120 60"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: '#C0392B' }}
          >
            {/* Red oval background */}
            <ellipse cx="60" cy="30" rx="58" ry="28" fill="currentColor" />

            {/* Left arrows */}
            <g fill="white">
              <path d="M 25 30 L 32 24 L 30 26 L 24 32 Z" />
              <path d="M 18 30 L 25 24 L 23 26 L 17 32 Z" />
            </g>

            {/* Right arrows */}
            <g fill="white">
              <path d="M 95 30 L 88 24 L 90 26 L 96 32 Z" />
              <path d="M 102 30 L 95 24 L 97 26 L 103 32 Z" />
            </g>

            {/* Center dots */}
            <circle cx="45" cy="30" r="2" fill="white" />
            <circle cx="53" cy="30" r="2" fill="white" />
            <circle cx="60" cy="30" r="2" fill="white" />
            <circle cx="67" cy="30" r="2" fill="white" />
            <circle cx="75" cy="30" r="2" fill="white" />
          </svg>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\:hidden {
            display: none !important;
          }
          .print\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  )
}
