'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']

export default function InventoryPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('wines')
          .select('*')
          .eq('status', 'Active')
          .order('colour_style')
          .order('country')
          .order('region')
          .order('producer')

        if (error) throw error
        setWines(data || [])
      } catch (err) {
        const error = err as Error
        toast.error('Failed to load wines')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchWines()
  }, [router])

  // Get unique values for filters
  const styles = useMemo(() => {
    return Array.from(new Set(wines.map((w) => w.colour_style).filter((s): s is string => s !== null)))
      .sort()
  }, [wines])

  const countries = useMemo(() => {
    return Array.from(new Set(wines.map((w) => w.country).filter((c): c is string => c !== null)))
      .sort()
  }, [wines])

  const regions = useMemo(() => {
    const filtered = selectedCountry
      ? wines.filter((w) => w.country === selectedCountry)
      : wines

    return Array.from(new Set(filtered.map((w) => w.region).filter((r): r is string => r !== null)))
      .sort()
  }, [wines, selectedCountry])

  // Filter wines
  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      // Text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (
          !wine.producer?.toLowerCase().includes(term) &&
          !wine.name?.toLowerCase().includes(term) &&
          !wine.inventory_location?.toLowerCase().includes(term)
        ) {
          return false
        }
      }

      // Style filter
      if (selectedStyle && wine.colour_style !== selectedStyle) {
        return false
      }

      // Country filter
      if (selectedCountry && wine.country !== selectedCountry) {
        return false
      }

      // Region filter
      if (selectedRegion && wine.region !== selectedRegion) {
        return false
      }

      return true
    })
  }, [wines, searchTerm, selectedStyle, selectedCountry, selectedRegion])

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red mx-auto"></div>
          <p className="mt-4 text-onda-500">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/wines" className="text-onda-red font-medium hover:opacity-80">
              ← Back to Wines
            </Link>
            <h1 className="text-3xl font-bold text-onda-primary">Wine Inventory</h1>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-onda-red text-white rounded-lg font-medium text-sm hover:opacity-90 transition"
            >
              🖨️ Print
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
            <input
              type="text"
              placeholder="Search by producer, wine, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
            />

            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
            >
              <option value="">All Styles</option>
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value)
                setSelectedRegion('')
              }}
              className="px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={!selectedCountry}
              className="px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent disabled:opacity-50"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-onda-500">No wines match your filters</p>
          </div>
        ) : (
          <div className="bg-white border border-onda-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-onda-50 border-b border-onda-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Style
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Producer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Wine Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-onda-primary">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-onda-200">
                {filteredWines.map((wine) => (
                  <tr key={wine.id} className="hover:bg-onda-50 transition">
                    <td className="px-6 py-4 text-sm text-onda-600 font-medium">
                      {wine.colour_style}
                    </td>
                    <td className="px-6 py-4 text-sm text-onda-700">{wine.country || '—'}</td>
                    <td className="px-6 py-4 text-sm text-onda-700">{wine.region || '—'}</td>
                    <td className="px-6 py-4 text-sm text-onda-900 font-medium">
                      {wine.producer}
                    </td>
                    <td className="px-6 py-4 text-sm text-onda-700">{wine.name || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-onda-red">
                      {wine.inventory_location || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="bg-onda-50 border-t border-onda-200 px-6 py-3 text-sm text-onda-600">
              Showing {filteredWines.length} of {wines.length} wines
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .ml-64 {
            margin-left: 0 !important;
          }
          .print\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
          .bg-onda-50 {
            background: #fafaf9 !important;
          }
        }
      `}</style>
    </div>
  )
}
