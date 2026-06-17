'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SECTION_ORDER } from '@/constants/menu-sections'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']

export default function CreateMenuPage() {
  const router = useRouter()
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWines, setSelectedWines] = useState<Set<string>>(new Set())
  const [menuTitle, setMenuTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterColour, setFilterColour] = useState('')

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
          .order('colour_style', { ascending: true })
          .order('country', { ascending: true })

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

  const colours = useMemo(
    () => Array.from(new Set(wines.map((w) => w.colour_style))).sort(),
    [wines]
  )

  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      const searchMatch =
        searchTerm === '' ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.name.toLowerCase().includes(searchTerm.toLowerCase())
      const colourMatch = filterColour === '' || wine.colour_style === filterColour
      return searchMatch && colourMatch
    })
  }, [wines, searchTerm, filterColour])

  const winesByColour = useMemo(() => {
    const grouped: { [key: string]: Wine[] } = {}
    filteredWines.forEach((wine) => {
      if (!grouped[wine.colour_style]) {
        grouped[wine.colour_style] = []
      }
      grouped[wine.colour_style].push(wine)
    })
    return grouped
  }, [filteredWines])

  const previewSections = useMemo(() => {
    const selected = Array.from(selectedWines)
      .map((id) => wines.find((w) => w.id === id))
      .filter(Boolean) as Wine[]

    const grouped: { [key: string]: Wine[] } = {}
    selected.forEach((wine) => {
      if (!grouped[wine.colour_style]) {
        grouped[wine.colour_style] = []
      }
      grouped[wine.colour_style].push(wine)
    })

    return SECTION_ORDER.filter((section) => grouped[section.key]).map((section) => ({
      key: section.key,
      display: section.display,
      wines: grouped[section.key],
    }))
  }, [selectedWines, wines])

  const toggleWine = (wineId: string) => {
    const newSelected = new Set(selectedWines)
    if (newSelected.has(wineId)) {
      newSelected.delete(wineId)
    } else {
      newSelected.add(wineId)
    }
    setSelectedWines(newSelected)
  }

  const handleCreateMenu = async () => {
    if (!menuTitle.trim()) {
      toast.error('Enter a menu title')
      return
    }
    if (selectedWines.size === 0) {
      toast.error('Select at least one wine')
      return
    }

    setSaving(true)
    try {
      // Create menu
      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .insert([{ title: menuTitle }])
        .select()
        .single()

      if (menuError) throw menuError

      // Create sections and items
      let sectionOrder = 0
      const selectedWineIds = Array.from(selectedWines)
      const selectedWineObjs = selectedWineIds
        .map((id) => wines.find((w) => w.id === id))
        .filter(Boolean) as Wine[]

      for (const section of SECTION_ORDER) {
        const sectionWines = selectedWineObjs.filter((w) => w.colour_style === section.key)
        if (sectionWines.length === 0) continue

        const { data: sectionData, error: sectionError } = await supabase
          .from('menu_sections')
          .insert([
            {
              menu_id: menuData.id,
              name: section.display,
              sort_order: sectionOrder++,
            },
          ])
          .select()
          .single()

        if (sectionError) throw sectionError

        // Create menu items
        const items = sectionWines.map((wine, idx) => ({
          section_id: sectionData.id,
          wine_id: wine.id,
          sort_order: idx,
        }))

        const { error: itemsError } = await supabase.from('menu_items').insert(items)
        if (itemsError) throw itemsError
      }

      toast.success('Menu created!')
      router.push(`/menus/${menuData.id}`)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to create menu')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50">
        <div className="border-b border-onda-200 bg-white">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-onda-900">Create Menu</h1>
          </div>
        </div>
        <main className="p-8 text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red"></div>
          </div>
          <p className="mt-4 text-onda-500">Loading wines...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-onda-900">Create Menu</h1>
          <p className="text-onda-500 mt-1">Select wines to build your menu.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wine Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Menu Title */}
            <div className="bg-white rounded-lg border border-onda-200 p-6 shadow-xs">
              <label className="block text-sm font-medium text-onda-700 mb-2">
                Menu Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="e.g., Summer 2026, June 20-26"
                disabled={saving}
                className="w-full px-3 py-2 border border-onda-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search producer or wine name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={saving}
                className="flex-1 px-3 py-2 border border-onda-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
              />
              <select
                value={filterColour}
                onChange={(e) => setFilterColour(e.target.value)}
                disabled={saving}
                className="px-3 py-2 border border-onda-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-onda-red focus:border-transparent"
              >
                <option value="">All Styles</option>
                {colours.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Wine List by Colour */}
            <div className="space-y-6">
              {Object.entries(winesByColour).map(([colour, colourWines]) => (
                <div key={colour} className="bg-white rounded-lg border border-onda-200 overflow-hidden shadow-xs">
                  <h3 className="bg-onda-50 border-b border-onda-200 px-6 py-3 font-semibold text-onda-900">
                    {colour}
                  </h3>
                  <div className="divide-y divide-slate-200">
                    {colourWines.map((wine) => (
                      <label
                        key={wine.id}
                        className="flex items-start gap-3 px-6 py-4 hover:bg-onda-50 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWines.has(wine.id)}
                          onChange={() => toggleWine(wine.id)}
                          disabled={saving}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-onda-900">
                            {wine.producer} – {wine.name} {wine.vintage || ''}
                          </p>
                          <p className="text-sm text-onda-500 mt-0.5">
                            {wine.region} {wine.country && `(${wine.country})`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-onda-600 whitespace-nowrap flex flex-col items-end gap-1">
                          {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                          <div>B: €{wine.sale_price != null ? wine.sale_price.toFixed(2) : '—'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-lg border border-onda-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-semibold text-onda-900">Preview</h3>
                <p className="text-4xl font-bold text-onda-red mt-2">
                  {selectedWines.size}
                </p>
                <p className="text-sm text-onda-500 mt-1">
                  wine{selectedWines.size !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="pt-6 border-t border-onda-200 space-y-4">
                {previewSections.length === 0 ? (
                  <p className="text-sm text-onda-500">Select wines to preview</p>
                ) : (
                  previewSections.map((section) => (
                    <div key={section.key}>
                      <p className="font-medium text-onda-900 text-sm">
                        {section.display}
                      </p>
                      <p className="text-xs text-onda-500 mt-0.5">
                        {section.wines.length} wine{section.wines.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleCreateMenu}
                  disabled={saving || selectedWines.size === 0 || !menuTitle.trim()}
                  className="w-full py-2 bg-onda-red text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
                >
                  {saving ? 'Creating...' : 'Create Menu'}
                </button>

                <button
                  onClick={() => setSelectedWines(new Set())}
                  disabled={saving}
                  className="w-full py-2 border border-onda-200 text-onda-700 rounded-lg font-medium text-sm hover:bg-onda-50 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
