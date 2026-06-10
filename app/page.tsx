'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WineListClient } from '@/components/wine-list-client'

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
  importer: string | null
  cost_price: number | null
  sale_price: number | null
  glass_price: number | null
  inventory_location: string | null
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/wines?status=eq.Active&order=colour_style.asc,country.asc', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
            'Authorization': `Bearer ${JSON.parse(token).access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch wines: ${response.status}`)
        }

        const data = await response.json()
        setWines(data)
      } catch (err) {
        const error = err as Error
        console.error('Error fetching wines:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWines()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('supabase.auth.token')
    router.push('/login')
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Onda OS</h1>
              <p className="text-slate-600 mt-2">Wine Inventory & Menu Generator</p>
            </div>
            <div className="space-x-4">
              <Link
                href="/menu/new"
                className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Create Menu
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Wine List</h2>
            <p className="text-slate-600 mt-1">{wines.length} wines available</p>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>

          {wines.length > 0 ? (
            <WineListClient initialWines={wines} />
          ) : (
            <div className="p-8 text-center text-slate-600">
              No wines found
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
