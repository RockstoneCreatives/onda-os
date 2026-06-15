import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'
import { SECTION_ORDER, isHierarchical } from '@/constants/menu-sections'
import type { Database } from '@/lib/supabase/client'
import React from 'react'

type Wine = Database['public']['Tables']['wines']['Row']

interface WineWithSort extends Wine {
  sort_order: number
}

interface MenuSectionData {
  id: string
  name: string
  sort_order: number
  menu_items: Array<{
    id: string
    wine_id: string
    sort_order: number
    wines: Wine
  }>
}

interface MenuData {
  id: string
  title: string
  created_at: string
  menu_sections: MenuSectionData[]
}

// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 12,
    color: '#000000',
  },
  countryHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#000000',
  },
  regionHeader: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 5,
    color: '#000000',
  },
  wineRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 3,
  },
  wineNameText: {
    flex: 1,
    fontSize: 10,
  },
  priceText: {
    fontSize: 10,
    width: 50,
    textAlign: 'right' as const,
  },
})

async function fetchMenuData(menuId: string): Promise<MenuData> {
  const { data, error } = await supabase
    .from('menus')
    .select(`
      id,
      title,
      created_at,
      menu_sections(
        id,
        name,
        sort_order,
        menu_items(
          id,
          wine_id,
          sort_order,
          wines(*)
        )
      )
    `)
    .eq('id', menuId)
    .single()

  if (error) throw error
  return data as unknown as MenuData
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: menuId } = await params
    console.log('[PDF] Fetching menu data for:', menuId)

    const menuData = await fetchMenuData(menuId)
    if (!menuData) {
      console.log('[PDF] Menu not found:', menuId)
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    console.log('[PDF] Menu found:', menuData.title)

    const sections = (menuData.menu_sections || [])
      .sort((a, b) => a.sort_order - b.sort_order)

    const sectionOrderMap: Map<string, number> = new Map(
      SECTION_ORDER.map((s, idx) => [s.display, idx])
    )

    const sortedSections = sections.sort((a, b) => {
      const aIdx = sectionOrderMap.get(a.name as string) ?? 999
      const bIdx = sectionOrderMap.get(b.name as string) ?? 999
      return aIdx - bIdx
    })

    console.log('[PDF] Rendering', sortedSections.length, 'sections')

    // Build content
    const content: React.ReactElement[] = []

    sortedSections.forEach((section) => {
      const sectionWines = (section.menu_items || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => item.wines ? { ...item.wines, sort_order: item.sort_order } : null)
        .filter((w): w is WineWithSort => w !== null)

      const sectionKey = SECTION_ORDER.find((s) => s.display === section.name)?.key || ''
      const useHierarchy = isHierarchical(sectionKey)

      // Section header
      content.push(
        React.createElement(
          Text,
          { key: `header-${section.id}`, style: styles.sectionHeader },
          section.name
        )
      )

      if (useHierarchy && sectionWines.length > 0) {
        const countryMap = new Map<string, Map<string, WineWithSort[]>>()

        sectionWines.forEach((wine) => {
          const country = wine.country || 'Unknown'
          if (!countryMap.has(country)) {
            countryMap.set(country, new Map())
          }
          const regionMap = countryMap.get(country)!
          const region = wine.region || 'Other'
          if (!regionMap.has(region)) {
            regionMap.set(region, [])
          }
          regionMap.get(region)!.push(wine)
        })

        Array.from(countryMap.entries()).forEach(([country, regionMap]) => {
          content.push(
            React.createElement(
              Text,
              { key: `country-${section.id}-${country}`, style: styles.countryHeader },
              country
            )
          )

          Array.from(regionMap.entries()).forEach(([region, wines]) => {
            if (region !== 'Other') {
              content.push(
                React.createElement(
                  Text,
                  { key: `region-${section.id}-${country}-${region}`, style: styles.regionHeader },
                  region
                )
              )
            }

            wines.forEach((wine) => {
              content.push(
                React.createElement(
                  View,
                  { key: `wine-${section.id}-${wine.id}`, style: styles.wineRow },
                  React.createElement(
                    Text,
                    { style: styles.wineNameText },
                    `${wine.producer} – ${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''}${wine.grapes ? ` – ${wine.grapes}` : ''}`
                  ),
                  React.createElement(
                    Text,
                    { style: styles.priceText },
                    wine.glass_price ? Math.round(wine.glass_price).toString() : ''
                  ),
                  React.createElement(
                    Text,
                    { style: styles.priceText },
                    wine.sale_price ? Math.round(wine.sale_price).toString() : ''
                  )
                )
              )
            })
          })
        })
      } else {
        // Non-hierarchical
        const regionMap = new Map<string, WineWithSort[]>()
        sectionWines.forEach((wine) => {
          const region = wine.country || wine.region || 'Other'
          if (!regionMap.has(region)) {
            regionMap.set(region, [])
          }
          regionMap.get(region)!.push(wine)
        })

        Array.from(regionMap.entries()).forEach(([region, wines]) => {
          content.push(
            React.createElement(
              Text,
              { key: `region-${section.id}-${region}`, style: styles.regionHeader },
              region
            )
          )

          wines.forEach((wine) => {
            content.push(
              React.createElement(
                View,
                { key: `wine-${section.id}-${wine.id}`, style: styles.wineRow },
                React.createElement(
                  Text,
                  { style: styles.wineNameText },
                  `${wine.producer} – ${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''}${wine.grapes ? ` – ${wine.grapes}` : ''}`
                ),
                React.createElement(
                  Text,
                  { style: styles.priceText },
                  wine.glass_price ? Math.round(wine.glass_price).toString() : ''
                ),
                React.createElement(
                  Text,
                  { style: styles.priceText },
                  wine.sale_price ? Math.round(wine.sale_price).toString() : ''
                )
              )
            )
          })
        })
      }
    })

    console.log('[PDF] Content built, rendering to buffer')

    const pdfDocument = React.createElement(
      Document,
      { title: `ONDA-Menu-${menuData.title}` },
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        ...content
      )
    )

    const buffer = await renderToBuffer(pdfDocument)
    console.log('[PDF] Buffer created, size:', buffer.length)

    const filename = `ONDA-Menu-${menuData.title}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PDF] Error:', errorMsg)
    if (error instanceof Error) {
      console.error('[PDF] Stack:', error.stack)
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
