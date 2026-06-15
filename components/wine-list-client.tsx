'use client'

import { useState, useMemo } from 'react'
import { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']

interface WineListClientProps {
  initialWines: Wine[]
}

export function WineListClient({ initialWines }: WineListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterColour, setFilterColour] = useState<string>('')
  const [filterCountry, setFilterCountry] = useState<string>('')
  const [filterBTG, setFilterBTG] = useState<boolean | null>(null)

  // Get unique values for filters
  const colours = useMemo(() => {
    return Array.from(new Set(initialWines.map((w) => w.colour_style))).sort()
  }, [initialWines])

  const countries = useMemo(() => {
    return Array.from(new Set(initialWines.map((w) => w.country).filter(Boolean))) as string[]
  }, [initialWines])

  // Filter wines
  const filteredWines = useMemo(() => {
    return initialWines.filter((wine) => {
      const matchesSearch =
        searchTerm === '' ||
        wine.producer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.country?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesColour = filterColour === '' || wine.colour_style === filterColour
      const matchesCountry = filterCountry === '' || wine.country === filterCountry
      const matchesBTG = filterBTG === null || wine.btg === filterBTG

      return matchesSearch && matchesColour && matchesCountry && matchesBTG
    })
  }, [initialWines, searchTerm, filterColour, filterCountry, filterBTG])

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-onda-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Producer, wine name, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-onda-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-onda-700 mb-2">Wine Style</label>
            <select
              value={filterColour}
              onChange={(e) => setFilterColour(e.target.value)}
              className="w-full px-4 py-2 border border-onda-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Styles</option>
              {colours.map((colour) => (
                <option key={colour} value={colour}>
                  {colour}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-onda-700 mb-2">Country</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-4 py-2 border border-onda-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-onda-700 mb-2">By the Glass</label>
            <select
              value={filterBTG === null ? '' : filterBTG ? 'yes' : 'no'}
              onChange={(e) => {
                if (e.target.value === '') setFilterBTG(null)
                else setFilterBTG(e.target.value === 'yes')
              }}
              className="w-full px-4 py-2 border border-onda-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="yes">By the Glass</option>
              <option value="no">Bottle Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-onda-600 mb-4">
        Showing {filteredWines.length} of {initialWines.length} wines
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-onda-200 bg-onda-50">
              <th className="px-4 py-3 text-left font-medium text-onda-900">Producer</th>
              <th className="px-4 py-3 text-left font-medium text-onda-900">Wine</th>
              <th className="px-4 py-3 text-left font-medium text-onda-900">Vintage</th>
              <th className="px-4 py-3 text-left font-medium text-onda-900">Country</th>
              <th className="px-4 py-3 text-left font-medium text-onda-900">Style</th>
              <th className="px-4 py-3 text-right font-medium text-onda-900">Glass</th>
              <th className="px-4 py-3 text-right font-medium text-onda-900">Bottle</th>
            </tr>
          </thead>
          <tbody>
            {filteredWines.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-onda-600">
                  No wines match your filters
                </td>
              </tr>
            ) : (
              filteredWines.map((wine) => (
                <tr key={wine.id} className="border-b border-onda-200 hover:bg-onda-50">
                  <td className="px-4 py-3 text-onda-900 font-medium">{wine.producer}</td>
                  <td className="px-4 py-3 text-onda-900">{wine.name}</td>
                  <td className="px-4 py-3 text-onda-600">{wine.vintage || 'NV'}</td>
                  <td className="px-4 py-3 text-onda-600">{wine.country}</td>
                  <td className="px-4 py-3 text-onda-600">{wine.colour_style}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {wine.glass_price ? `€${wine.glass_price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    €{wine.sale_price?.toFixed(2) || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
