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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-onda-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-onda-accent font-bold text-lg hover:opacity-80">
              ← Back
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Wine List</h1>
          <div className="flex gap-4">
            <Link
              href="/wines/new"
              className="px-4 py-2 bg-onda-accent text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              + Add Wine
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-onda-border text-slate-700 rounded-lg hover:bg-onda-surface transition text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading wines...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-onda-surface rounded-lg border border-onda-border p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Producer, name, country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Style</label>
                  <select
                    value={filterColour}
                    onChange={(e) => setFilterColour(e.target.value)}
                    className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent text-sm"
                  >
                    <option value="">All Styles</option>
                    {colours.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent text-sm"
                  >
                    <option value="">All Countries</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition ${
                      showInactive
                        ? 'bg-onda-accent text-white border-onda-accent'
                        : 'border-onda-border text-slate-700 hover:bg-white'
                    }`}
                  >
                    {showInactive ? 'Showing All' : 'Active Only'}
                  </button>
                </div>
              </div>

              <details className="pt-4 border-t border-onda-border">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-onda-accent">
                  Column Settings ⚙️
                </summary>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => handleToggleColumn(col.key)}
                        className="rounded"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </details>
            </div>

            {/* Results */}
            <p className="text-sm text-slate-600 mb-4">
              Showing {filteredWines.length} of {wines.length} wines
            </p>

            {/* Table */}
            <div className="bg-white rounded-lg border border-onda-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-onda-surface border-b border-onda-border">
                      <th className="px-4 py-3 text-left font-medium text-slate-900 w-12">#</th>
                      {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left font-medium text-slate-900">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left font-medium text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWines.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumns.length + 2} className="px-4 py-8 text-center text-slate-600">
                          No wines found
                        </td>
                      </tr>
                    ) : (
                      filteredWines.map((wine, idx) => (
                        <tr key={wine.id} className="border-b border-onda-border hover:bg-onda-surface transition">
                          <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                          {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => {
                            const value = wine[col.key]
                            let display = ''

                            if (value === null || value === undefined) {
                              display = '—'
                            } else if (col.key === 'btg') {
                              display = value ? 'Yes' : 'No'
                            } else if (col.key === 'status') {
                              display = value as string
                            } else if (typeof value === 'number') {
                              display = '€' + value.toFixed(2)
                            } else {
                              display = String(value)
                            }

                            return (
                              <td key={col.key} className="px-4 py-3 text-slate-700">
                                {display}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3">
                            <Link
                              href={`/wines/${wine.id}/edit`}
                              className="text-onda-accent hover:underline text-sm font-medium"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
