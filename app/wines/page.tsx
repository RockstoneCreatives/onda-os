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
  { key: 'producer', label: 'Producer' },
  { key: 'name', label: 'Name' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'colour_style', label: 'Style' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'grapes', label: 'Grapes' },
  { key: 'importer', label: 'Importer' },
  { key: 'btg', label: 'By The Glass' },
  { key: 'cost_price', label: 'Cost Price' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'glass_price', label: 'Glass Price' },
  { key: 'inventory_location', label: 'Location' },
  { key: 'tasting_notes', label: 'Tasting Notes' },
  { key: 'status', label: 'Status' },
]

const DEFAULT_COLUMNS: ColumnKey[] = ['producer', 'name', 'vintage', 'colour_style', 'country', 'sale_price', 'status']

export default function WinesPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterColour, setFilterColour] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS)

  useEffect(() => {
    const saved = localStorage.getItem('wine-list-columns')
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
          .order('colour_style', { ascending: true })
          .order('producer', { ascending: true })

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

  const colours = useMemo(() => {
    return Array.from(new Set(wines.map((w) => w.colour_style).filter((s): s is string => s !== null))).sort()
  }, [wines])

  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      const statusMatch = showInactive ? true : wine.status === 'Active'
      const searchMatch =
        searchTerm === '' ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.name.toLowerCase().includes(searchTerm.toLowerCase())
      const colourMatch = filterColour === '' || wine.colour_style === filterColour
      return statusMatch && searchMatch && colourMatch
    })
  }, [wines, showInactive, searchTerm, filterColour])

  const handleToggleColumn = (col: ColumnKey) => {
    const updated = visibleColumns.includes(col)
      ? visibleColumns.filter((c) => c !== col)
      : [...visibleColumns, col]
    setVisibleColumns(updated)
    localStorage.setItem('wine-list-columns', JSON.stringify(updated))
  }

  const getDisplayValue = (wine: Wine, key: ColumnKey): string => {
    const value = wine[key]
    if (value === null || value === undefined) return '—'
    if (key === 'btg') return (value as boolean) ? 'Yes' : 'No'
    if (key === 'sale_price' || key === 'glass_price' || key === 'cost_price') {
      return `€${(value as number).toFixed(2)}`
    }
    if (key === 'tasting_notes') {
      const text = String(value)
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    }
    return String(value)
  }

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-onda-900">Wine List</h1>
            <p className="text-onda-500 mt-1">{filteredWines.length} wines</p>
          </div>
          <Link
            href="/wines/new"
            className="px-4 py-2 bg-onda-red text-white rounded-lg hover:bg-onda-600 transition font-medium text-sm shadow-sm"
          >
            + Add Wine
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red"></div>
            <p className="mt-4 text-onda-500">Loading wines...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg border border-onda-200 p-4 mb-6 shadow-xs">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-onda-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by producer or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-onda-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-onda-700 mb-2">Style</label>
                  <select
                    value={filterColour}
                    onChange={(e) => setFilterColour(e.target.value)}
                    className="w-full px-3 py-2 border border-onda-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
                  >
                    <option value="">All Styles</option>
                    {colours.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-onda-700 font-medium">Show Inactive</span>
                </label>

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

            {/* Table */}
            <div className="bg-white rounded-lg border border-onda-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-onda-200 bg-onda-50">
                      {visibleColumns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-6 py-3 font-semibold text-xs text-onda-700 uppercase tracking-wider"
                        >
                          {ALL_COLUMNS.find((c) => c.key === col)?.label}
                        </th>
                      ))}
                      <th className="text-left px-6 py-3 font-semibold text-xs text-onda-700 uppercase tracking-wider w-16">
                        Action
                      </th>
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
                          else if (col === 'status') {
                            cellClass += wine.status === 'Active'
                              ? ' text-green-600 font-medium'
                              : ' text-red-600 font-medium'
                          } else cellClass += ' text-onda-600'

                          return (
                            <td key={col} className={cellClass}>
                              {getDisplayValue(wine, col)}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/wines/${wine.id}/edit`}
                            className="text-onda-red hover:text-onda-600 font-medium transition"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
