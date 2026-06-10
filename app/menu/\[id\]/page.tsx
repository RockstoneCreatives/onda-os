'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface MenuSection {
  id: string
  name: string
  sort_order: number
  wines: Wine[]
}

interface Wine {
  id: string
  colour_style: string
  producer: string
  name: string
  vintage: string | null
  grapes: string | null
  sale_price: number | null
  glass_price: number | null
}

interface Menu {
  id: string
  title: string
  sections: MenuSection[]
}

export default function MenuDetailPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token')
        if (!token) {
          router.push('/login')
          return
        }

        const accessToken = JSON.parse(token).access_token

        // Fetch menu with sections and items
        const response = await fetch(
          `https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menus?id=eq.${menuId}`,
          {
            headers: {
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        const menus = await response.json()
        if (!menus[0]) {
          router.push('/')
          return
        }

        const menu = menus[0]

        // Fetch sections
        const sectionsResponse = await fetch(
          `https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menu_sections?menu_id=eq.${menuId}&order=sort_order.asc`,
          {
            headers: {
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        const sections = await sectionsResponse.json()

        // Fetch items for each section
        const sectionsWithWines = await Promise.all(
          sections.map(async (section) => {
            const itemsResponse = await fetch(
              `https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menu_items?section_id=eq.${section.id}&order=sort_order.asc`,
              {
                headers: {
                  apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            )

            const items = await itemsResponse.json()

            // Fetch wine details for each item
            const wines = await Promise.all(
              items.map(async (item) => {
                const wineResponse = await fetch(
                  `https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/wines?id=eq.${item.wine_id}`,
                  {
                    headers: {
                      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
                      Authorization: `Bearer ${accessToken}`,
                    },
                  }
                )
                const wine = await wineResponse.json()
                return wine[0]
              })
            )

            return {
              ...section,
              wines,
            }
          })
        )

        setMenu({
          id: menu.id,
          title: menu.title,
          sections: sectionsWithWines,
        })
      } catch (err) {
        console.error('Error fetching menu:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Menu not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Wine List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{menu.title}</h1>
            <p className="text-slate-600 mt-1">{menu.sections.reduce((sum, s) => sum + s.wines.length, 0)} wines</p>
          </div>
          <div className="space-x-4">
            <Link
              href={`/menu/${menuId}/pdf`}
              className="inline-block px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              Download PDF
            </Link>
            <Link href="/" className="inline-block px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Preview */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          {menu.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{section.name}</h2>
              <div className="text-right text-sm text-slate-600 mb-4">glass / bottle</div>
              <div className="space-y-3">
                {section.wines.map((wine) => (
                  <div key={wine.id} className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {wine.producer} – {wine.name} {wine.vintage}
                      </p>
                      <p className="text-sm text-slate-600 italic">{wine.grapes}</p>
                    </div>
                    <div className="text-right text-sm font-medium">
                      {wine.glass_price && <div>€{wine.glass_price.toFixed(2)}</div>}
                      <div>€{wine.sale_price?.toFixed(2)}</div>
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
