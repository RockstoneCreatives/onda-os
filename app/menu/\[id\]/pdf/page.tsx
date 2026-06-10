'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Wine {
  id: string
  producer: string
  name: string
  vintage: string | null
  grapes: string | null
  sale_price: number | null
  glass_price: number | null
}

interface MenuSection {
  id: string
  name: string
  wines: Wine[]
}

interface Menu {
  title: string
  sections: MenuSection[]
}

export default function MenuPDFPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token')
        if (!token) {
          router.push('/login')
          return
        }

        const accessToken = JSON.parse(token).access_token

        // Fetch menu
        const menuResponse = await fetch(
          `https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menus?id=eq.${menuId}`,
          {
            headers: {
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        const menus = await menuResponse.json()
        if (!menus[0]) {
          setError('Menu not found')
          return
        }

        const menuData = menus[0]

        // Fetch sections with wines
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
              id: section.id,
              name: section.name,
              wines,
            }
          })
        )

        setMenu({
          title: menuData.title,
          sections: sectionsWithWines,
        })
      } catch (err) {
        console.error('Error fetching menu:', err)
        setError('Failed to load menu')
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuId, router])

  const generatePDF = async () => {
    if (!menu) return

    try {
      // Create HTML content that matches Onda's PDF design
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>${menu.title}</title>
          <style>
            * { margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
              padding: 40px;
            }
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .section-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            .wine {
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .wine-details {
              flex: 1;
            }
            .wine-name {
              font-size: 14px;
              margin-bottom: 4px;
            }
            .wine-grapes {
              font-size: 12px;
              color: #666;
              font-style: italic;
            }
            .wine-price {
              text-align: right;
              white-space: nowrap;
              margin-left: 20px;
              font-size: 13px;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; margin-bottom: 40px; font-size: 24px;">${menu.title}</h1>
          ${menu.sections
            .map(
              (section) => `
            <div class="section">
              <div class="section-header">${section.name}</div>
              ${section.wines
                .map(
                  (wine) => `
                <div class="wine">
                  <div class="wine-details">
                    <div class="wine-name"><strong>${wine.producer}</strong> – ${wine.name} ${wine.vintage || ''}</div>
                    ${wine.grapes ? `<div class="wine-grapes">${wine.grapes}</div>` : ''}
                  </div>
                  <div class="wine-price">
                    ${wine.glass_price ? `G: €${wine.glass_price.toFixed(2)}<br>` : ''}
                    B: €${wine.sale_price?.toFixed(2)}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
            )
            .join('')}
        </body>
        </html>
      `

      // Open print dialog
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF')
    }
  }

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

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Menu not found'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Wine List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">{menu.title} - PDF</h1>
          <div className="space-x-4">
            <button
              onClick={generatePDF}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              📄 Print/Save as PDF
            </button>
            <Link
              href={`/menu/${menuId}`}
              className="inline-block px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">{menu.title}</h2>
          </div>

          {menu.sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900">{section.name}</h3>
              <div className="text-right text-sm text-slate-600 mb-2">glass / bottle</div>
              {section.wines.map((wine) => (
                <div key={wine.id} className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {wine.producer} – {wine.name} {wine.vintage}
                    </p>
                    {wine.grapes && <p className="text-sm text-slate-600 italic">{wine.grapes}</p>}
                  </div>
                  <div className="text-right text-sm font-medium whitespace-nowrap ml-4">
                    {wine.glass_price && <div>€{wine.glass_price.toFixed(2)}</div>}
                    <div>€{wine.sale_price?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
