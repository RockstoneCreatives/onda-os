'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'
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
      <div className="min-h-screen bg-white">
        <Nav currentPage="create" />
        <main className="pt-24 text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
          <p className="mt-4 text-onda-muted font-condensed">Loading wines...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav currentPage="create" />

      <main className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        <h1 className="font-condensed font-bold uppercase text-5xl text-onda-accent mb-8">
          Create Menu
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wine Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Menu Title */}
            <div className="border border-onda-border p-4">
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Menu Title
              </label>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="e.g., Summer 2026, June 20-26"
                disabled={saving}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search producer or wine name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={saving}
                className="flex-1 px-3 py-2 border border-onda-border bg-white font-condensed text-sm focus:outline-none focus:border-onda-accent"
              />
              <select
                value={filterColour}
                onChange={(e) => setFilterColour(e.target.value)}
                disabled={saving}
                className="px-3 py-2 border border-onda-border bg-white font-condensed text-sm focus:outline-none focus:border-onda-accent"
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
                <div key={colour} className="border border-onda-border">
                  <h3 className="font-condensed font-bold uppercase text-onda-accent text-lg px-4 py-3 border-b border-onda-border bg-white">
                    {colour}
                  </h3>
                  <div className="space-y-0">
                    {colourWines.map((wine) => (
                      <label
                        key={wine.id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-onda-border hover:bg-onda-surface transition cursor-pointer last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWines.has(wine.id)}
                          onChange={() => toggleWine(wine.id)}
                          disabled={saving}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-condensed font-bold text-onda-text">
                            {wine.producer} – {wine.name} {wine.vintage || ''}
                          </p>
                          <p className="font-condensed text-sm text-onda-muted">
                            {wine.region} {wine.country && `(${wine.country})`}
                          </p>
                        </div>
                        <div className="text-right text-sm font-condensed text-onda-muted whitespace-nowrap">
                          {wine.glass_price && <div>G: €{wine.glass_price.toFixed(2)}</div>}
                          <div>B: €{wine.sale_price?.toFixed(2)}</div>
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
            <div className="sticky top-32 border border-onda-border p-4 space-y-4">
              <div>
                <h3 className="font-condensed font-bold uppercase text-onda-text">Preview</h3>
                <p className="text-4xl font-bold text-onda-accent mt-2 font-condensed">
                  {selectedWines.size}
                </p>
                <p className="text-sm text-onda-muted font-condensed">
                  wine{selectedWines.size !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="pt-4 border-t border-onda-border space-y-3">
                {previewSections.map((section) => (
                  <div key={section.key}>
                    <p className="font-condensed font-bold text-onda-text uppercase text-sm">
                      {section.display}
                    </p>
                    <p className="text-xs text-onda-muted font-condensed">
                      {section.wines.length} wine{section.wines.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreateMenu}
                disabled={saving || selectedWines.size === 0 || !menuTitle.trim()}
                className="w-full py-2 bg-onda-accent text-white font-condensed font-bold uppercase text-sm hover:opacity-85 disabled:opacity-50 transition"
              >
                {saving ? 'Creating...' : 'Create Menu'}
              </button>

              <button
                onClick={() => setSelectedWines(new Set())}
                disabled={saving}
                className="w-full py-2 border border-onda-border text-onda-text font-condensed font-bold uppercase text-xs hover:bg-onda-surface transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
