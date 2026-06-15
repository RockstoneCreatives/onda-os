'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'
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
  { key: 'btg', label: 'BTG' },
  { key: 'cost_price', label: 'Cost' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'glass_price', label: 'Glass Price' },
  { key: 'importer', label: 'Importer' },
  { key: 'inventory_location', label: 'Location' },
  { key: 'status', label: 'Status' },
]

const DEFAULT_COLUMNS: ColumnKey[] = [
  'producer',
  'name',
  'vintage',
  'colour_style',
  'country',
  'sale_price',
  'glass_price',
  'status',
]

export default function WinesPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterColour, setFilterColour] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wine-list-columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnKey[]
        setVisibleColumns(parsed)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Fetch wines
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
          .order('country', { ascending: true })
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
    return Array.from(new Set(wines.map((w) => w.colour_style))).sort()
  }, [wines])

  const countries = useMemo(() => {
    const countrySet = new Set(wines.map((w) => w.country).filter(Boolean))
    return Array.from(countrySet).sort() as string[]
  }, [wines])

  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      const statusMatch = showInactive ? true : wine.status === 'Active'
      const searchMatch =
        searchTerm === '' ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wine.country?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const colourMatch = filterColour === '' || wine.colour_style === filterColour
      const countryMatch = filterCountry === '' || wine.country === filterCountry

      return statusMatch && searchMatch && colourMatch && countryMatch
    })
  }, [wines, showInactive, searchTerm, filterColour, filterCountry])

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
    return String(value)
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav currentPage="wines" />

      <main className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-onda-muted font-condensed">Loading wines...</p>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <h1 className="font-condensed font-bold uppercase text-5xl text-onda-accent mb-8">
              Wine List
            </h1>

            {/* Controls */}
            <div className="mb-8 space-y-4">
              {/* Search and Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <input
                  type="text"
                  placeholder="Search by producer, name, country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-onda-border bg-white font-condensed text-sm focus:outline-none focus:border-onda-accent"
                />
                <select
                  value={filterColour}
                  onChange={(e) => setFilterColour(e.target.value)}
                  className="px-3 py-2 border border-onda-border bg-white font-condensed text-sm focus:outline-none focus:border-onda-accent"
                >
                  <option value="">All Styles</option>
                  {colours.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-3 py-2 border border-onda-border bg-white font-condensed text-sm focus:outline-none focus:border-onda-accent"
                >
                  <option value="">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status and Actions Row */}
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 font-condensed text-sm">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Show Inactive
                </label>

                <div className="flex gap-2">
                  <details className="font-condensed text-sm">
                    <summary className="cursor-pointer text-onda-accent hover:text-onda-text transition uppercase font-bold">
                      Columns
                    </summary>
                    <div className="absolute bg-white border border-onda-border mt-2 p-3 space-y-2 z-50 min-w-40">
                      {ALL_COLUMNS.map((col) => (
                        <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.key)}
                            onChange={() => handleToggleColumn(col.key)}
                            className="w-4 h-4"
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </details>
                  <Link
                    href="/wines/new"
                    className="px-3 py-2 bg-onda-accent text-white font-condensed font-bold uppercase text-sm hover:opacity-85 transition"
                  >
                    + Add Wine
                  </Link>
                </div>
              </div>
            </div>

            {/* Wine Count */}
            <p className="text-onda-muted font-condensed text-sm mb-4">
              {filteredWines.length} wine{filteredWines.length !== 1 ? 's' : ''} shown
            </p>

            {/* Table */}
            <div className="border border-onda-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-onda-border">
                    {visibleColumns.map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 font-condensed font-bold uppercase text-xs text-onda-text bg-white"
                      >
                        {ALL_COLUMNS.find((c) => c.key === col)?.label}
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 font-condensed font-bold uppercase text-xs text-onda-text bg-white w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWines.map((wine, idx) => (
                    <tr key={wine.id} className="border-b border-onda-border hover:bg-onda-surface transition">
                      {visibleColumns.map((col) => {
                        let cellClass = 'px-4 py-2 text-sm font-condensed'
                        if (col === 'producer') cellClass += ' font-bold text-onda-text'
                        else if (col === 'status')
                          cellClass +=
                            wine.status === 'Active'
                              ? ' text-green-600 font-bold'
                              : ' text-red-600 font-bold'
                        else cellClass += ' text-onda-muted'

                        return (
                          <td key={col} className={cellClass}>
                            {getDisplayValue(wine, col)}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-sm">
                        <Link
                          href={`/wines/${wine.id}/edit`}
                          className="text-onda-accent font-condensed font-bold hover:text-onda-text transition uppercase"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
