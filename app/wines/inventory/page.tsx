'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']
type ColumnKey = keyof Wine

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'colour_style', label: 'Style' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'producer', label: 'Producer' },
  { key: 'name', label: 'Wine Name' },
  { key: 'inventory_location', label: 'Location' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'grapes', label: 'Grapes' },
  { key: 'btg', label: 'By The Glass' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'glass_price', label: 'Glass Price' },
]

const DEFAULT_COLUMNS: ColumnKey[] = ['colour_style', 'country', 'region', 'producer', 'name', 'inventory_location']

export default function InventoryPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('wine-inventory-columns')
    if (saved) {
      try {
        setVisibleColumns(JSON.parse(saved) as ColumnKey[])
      } catch {}
    }
  }, [])

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

  const handleToggleColumn = (col: ColumnKey) => {
    const updated = visibleColumns.includes(col)
      ? visibleColumns.filter((c) => c !== col)
      : [...visibleColumns, col]
    setVisibleColumns(updated)
    localStorage.setItem('wine-inventory-columns', JSON.stringify(updated))
  }

  const getDisplayValue = (wine: Wine, key: ColumnKey): string => {
    const value = wine[key]
    if (value === null || value === undefined) return '—'
    if (key === 'btg') return (value as boolean) ? 'Yes' : 'No'
    if (key === 'sale_price' || key === 'glass_price') {
      return `€${(value as number).toFixed(2)}`
    }
    return String(value)
  }

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
          <div className="flex gap-4 items-end print:hidden">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by producer, wine, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
              />
            </div>

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

            {/* Column Visibility Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 border border-onda-200 rounded-lg text-sm font-medium text-onda-700 hover:bg-onda-50 transition">
                ⚙️ Columns
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-onda-200 rounded-lg shadow-lg hidden group-hover:block z-20">
                <div className="p-3 space-y-2">
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-onda-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => handleToggleColumn(col.key)}
                        className="w-4 h-4"
                      />
                      <span className="text-onda-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-onda-50 border-b border-onda-200">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col}
                        className="text-left px-6 py-3 font-semibold text-xs text-onda-700 uppercase tracking-wider"
                      >
                        {ALL_COLUMNS.find((c) => c.key === col)?.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWines.map((wine) => (
                    <tr
                      key={wine.id}
                      className="border-b border-onda-200 hover:bg-onda-50 transition"
                    >
                      {visibleColumns.map((col) => {
                        let cellClass = 'px-6 py-4 text-sm'
                        if (col === 'producer') cellClass += ' font-semibold text-onda-900'
                        else if (col === 'colour_style') cellClass += ' font-medium text-onda-600'
                        else if (col === 'inventory_location') cellClass += ' font-semibold text-onda-red'
                        else cellClass += ' text-onda-700'

                        return (
                          <td key={col} className={cellClass}>
                            {getDisplayValue(wine, col)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
