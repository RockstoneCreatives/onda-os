'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Wine {
  id: string
  colour_style: string
  region: string | null
  country: string | null
  producer: string
  name: string
  vintage: string | null
  grapes: string | null
  btg: boolean
  sale_price: number | null
  glass_price: number | null
}

export default function CreateMenuPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [selectedWines, setSelectedWines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [menuTitle, setMenuTitle] = useState('Menu')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(
          'https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/wines?status=eq.Active&order=colour_style.asc,country.asc',
          {
            headers: {
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${JSON.parse(token).access_token}`,
            },
          }
        )

        const data = await response.json()
        setWines(data)
      } catch (err) {
        console.error('Error fetching wines:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWines()
  }, [router])

  const toggleWine = (wineId: string) => {
    setSelectedWines((prev) =>
      prev.includes(wineId) ? prev.filter((id) => id !== wineId) : [...prev, wineId]
    )
  }

  const handleCreateMenu = async () => {
    if (selectedWines.length === 0) {
      alert('Please select at least one wine')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        router.push('/login')
        return
      }

      const accessToken = JSON.parse(token).access_token

      // Create menu
      const menuResponse = await fetch('https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: menuTitle }),
      })

      const menu = await menuResponse.json()
      if (!menu[0]?.id) {
        throw new Error('Failed to create menu')
      }

      const menuId = menu[0].id

      // Group wines by colour and country
      const groupedWines = selectedWines.reduce(
        (acc, wineId) => {
          const wine = wines.find((w) => w.id === wineId)
          if (!wine) return acc

          const key = `${wine.colour_style}|${wine.country}`
          if (!acc[key]) {
            acc[key] = { colour: wine.colour_style, country: wine.country, wines: [] }
          }
          acc[key].wines.push(wineId)
          return acc
        },
        {} as Record<string, { colour: string; country: string; wines: string[] }>
      )

      // Create sections and items
      let sectionOrder = 0
      for (const { colour, country, wines: groupWines } of Object.values(groupedWines)) {
        const sectionName = `${colour}${country ? ` - ${country}` : ''}`

        const sectionResponse = await fetch(
          'https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menu_sections',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              menu_id: menuId,
              name: sectionName,
              sort_order: sectionOrder++,
            }),
          }
        )

        const section = await sectionResponse.json()
        if (!section[0]?.id) {
          throw new Error('Failed to create menu section')
        }

        const sectionId = section[0].id

        // Create menu items
        let itemOrder = 0
        for (const wineId of groupWines) {
          await fetch('https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/menu_items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              section_id: sectionId,
              wine_id: wineId,
              sort_order: itemOrder++,
            }),
          })
        }
      }

      alert('Menu created successfully!')
      router.push(`/menu/${menuId}`)
    } catch (err) {
      console.error('Error creating menu:', err)
      alert('Failed to create menu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading wines...</p>
        </div>
      </div>
    )
  }

  const winesByColour = wines.reduce(
    (acc, wine) => {
      if (!acc[wine.colour_style]) {
        acc[wine.colour_style] = []
      }
      acc[wine.colour_style].push(wine)
      return acc
    },
    {} as Record<string, Wine[]>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Menu</h1>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            Back to Wine List
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Wine Selection */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Menu Title</label>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Summer 2026"
              />
            </div>

            {Object.entries(winesByColour).map(([colour, colourWines]) => (
              <div key={colour} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{colour}</h3>
                <div className="space-y-2">
                  {colourWines.map((wine) => (
                    <label key={wine.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWines.includes(wine.id)}
                        onChange={() => toggleWine(wine.id)}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {wine.producer} – {wine.name} {wine.vintage}
                        </p>
                        <p className="text-sm text-slate-600">
                          {wine.region} {wine.country && `(${wine.country})`}
                        </p>
                        <p className="text-sm text-slate-500">{wine.grapes}</p>
                      </div>
                      <div className="text-right text-sm font-medium text-slate-700">
                        {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                        <div>B: €{wine.sale_price?.toFixed(2)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Selection Summary</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{selectedWines.length}</p>
                <p className="text-sm text-slate-600">wines selected</p>
              </div>

              <button
                onClick={handleCreateMenu}
                disabled={saving || selectedWines.length === 0}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
              >
                {saving ? 'Creating...' : 'Create Menu'}
              </button>

              <button
                onClick={() => setSelectedWines([])}
                className="w-full py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
