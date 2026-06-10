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
    padding: 40,
    fontSize: 13,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    fontSize: 29,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#000000',
  },
  countryHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#000000',
  },
  regionHeader: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#000000',
  },
  wineRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  wineNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wineNameText: {
    flex: 1,
    fontSize: 13,
  },
  priceText: {
    fontSize: 13,
    width: 60,
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

// Create PDF document using createElement
function createMenuPDF(menuData: MenuData) {
  const sections = menuData.menu_sections.sort((a, b) => a.sort_order - b.sort_order)
  const sectionOrderMap: Map<string, number> = new Map(
    SECTION_ORDER.map((s, idx) => [s.display, idx])
  )

  const sortedSections = sections.sort((a, b) => {
    const aIdx = sectionOrderMap.get(a.name as string) ?? 999
    const bIdx = sectionOrderMap.get(b.name as string) ?? 999
    return aIdx - bIdx
  })

  // Build page content
  const pageElements: React.ReactElement[] = []

  sortedSections.forEach((section) => {
    const sectionWines = section.menu_items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({ ...item.wines, sort_order: item.sort_order }))
      .filter((w): w is WineWithSort => Boolean(w))

    const useHierarchy = isHierarchical(
      SECTION_ORDER.find((s) => s.display === section.name)?.key || ''
    )

    // Section header
    pageElements.push(
      React.createElement(Text, { key: `header-${section.id}`, style: styles.sectionHeader }, section.name)
    )

    if (useHierarchy && sectionWines.length > 0) {
      const countryMap = new Map<string | null, Map<string | null, WineWithSort[]>>()

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
        pageElements.push(
          React.createElement(
            Text,
            { key: `country-${section.id}-${country}`, style: styles.countryHeader },
            country
          )
        )

        Array.from(regionMap.entries()).forEach(([region, wines]) => {
          if (region !== 'Other') {
            pageElements.push(
              React.createElement(
                Text,
                { key: `region-${section.id}-${country}-${region}`, style: styles.regionHeader },
                region
              )
            )
          }

          wines.forEach((wine) => {
            pageElements.push(
              React.createElement(
                View,
                { key: `wine-${wine.id}`, style: styles.wineRow },
                React.createElement(
                  View,
                  { style: styles.wineNameRow },
                  React.createElement(
                    Text,
                    { style: styles.wineNameText },
                    `${wine.producer} – ${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''}${wine.grapes ? ` – ${wine.grapes}` : ''}`
                  ),
                  React.createElement(
                    Text,
                    { style: styles.priceText },
                    wine.btg && wine.glass_price ? wine.glass_price.toFixed(2) : ''
                  ),
                  React.createElement(
                    Text,
                    { style: styles.priceText },
                    wine.sale_price ? Math.round(wine.sale_price).toString() : ''
                  )
                )
              )
            )
          })
        })
      })
    } else {
      // Flat list (no hierarchy)
      sectionWines.forEach((wine) => {
        pageElements.push(
          React.createElement(
            View,
            { key: `wine-${wine.id}`, style: styles.wineRow },
            React.createElement(
              View,
              { style: styles.wineNameRow },
              React.createElement(
                Text,
                { style: styles.wineNameText },
                `${wine.producer} – ${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''}${wine.grapes ? ` – ${wine.grapes}` : ''}`
              ),
              React.createElement(
                Text,
                { style: styles.priceText },
                wine.btg && wine.glass_price ? wine.glass_price.toFixed(2) : ''
              ),
              React.createElement(
                Text,
                { style: styles.priceText },
                wine.sale_price ? Math.round(wine.sale_price).toString() : ''
              )
            )
          )
        )
      })
    }
  })

  return React.createElement(
    Document,
    { title: `ONDA-Menu-${menuData.title}` },
    React.createElement(Page, { size: 'A4', style: styles.page }, ...pageElements)
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: menuId } = await params
    const menuData = await fetchMenuData(menuId)

    if (!menuData) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Generate PDF
    const pdf = createMenuPDF(menuData)
    const buffer = await renderToBuffer(pdf)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

    const filename = `ONDA-Menu-${menuData.title}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
