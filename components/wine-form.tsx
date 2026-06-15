'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']
type WineInsert = Database['public']['Tables']['wines']['Insert']

interface WineFormProps {
  wine?: Wine
  isEditing?: boolean
}

const MARKUP_OPTIONS = [2.5, 3, 3.5, 4]
const COLOUR_STYLES = ['Sparkling', 'Sweet', 'Rosé', 'Non-alcoholic', 'White', 'Orange/Skin Contact', 'Red']

export function WineForm({ wine, isEditing = false }: WineFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [costPrice, setCostPrice] = useState(wine?.cost_price?.toString() || '')
  const [salePrice, setSalePrice] = useState(wine?.sale_price?.toString() || '')
  const [glassPrice, setGlassPrice] = useState(wine?.glass_price?.toString() || '')
  const [btg, setBtg] = useState(wine?.btg || false)

  const [form, setForm] = useState({
    colour_style: wine?.colour_style || '',
    region: wine?.region || '',
    country: wine?.country || '',
    producer: wine?.producer || '',
    name: wine?.name || '',
    vintage: wine?.vintage || '',
    grapes: wine?.grapes || '',
    importer: wine?.importer || '',
    inventory_location: wine?.inventory_location || '',
    status: (wine?.status as 'Active' | 'Inactive') || 'Active',
  })

  const handleMarkupClick = (markup: number) => {
    const cost = parseFloat(costPrice)
    if (isNaN(cost)) {
      toast.error('Enter cost price first')
      return
    }
    const calculated = (cost * markup).toFixed(2)
    setSalePrice(calculated)
    if (btg) {
      const glass = (parseFloat(calculated) / 5.5).toFixed(2)
      setGlassPrice(glass)
    }
  }

  const handleSalePriceChange = (value: string) => {
    setSalePrice(value)
    if (btg && value) {
      const glass = (parseFloat(value) / 5.5).toFixed(2)
      setGlassPrice(glass)
    }
  }

  const handleBtgChange = (checked: boolean) => {
    setBtg(checked)
    if (checked && salePrice) {
      const glass = (parseFloat(salePrice) / 5.5).toFixed(2)
      setGlassPrice(glass)
    } else if (!checked) {
      setGlassPrice('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        router.push('/login')
        return
      }

      const payload: WineInsert = {
        ...form,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        sale_price: salePrice ? parseFloat(salePrice) : null,
        glass_price: glassPrice ? parseFloat(glassPrice) : null,
        btg,
      }

      if (isEditing && wine?.id) {
        const { error } = await supabase.from('wines').update(payload).eq('id', wine.id)
        if (error) throw error
        toast.success('Wine updated')
      } else {
        const { error } = await supabase.from('wines').insert([payload])
        if (error) throw error
        toast.success('Wine added')
      }

      router.push('/wines')
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to save wine')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Wine Details Section */}
      <div className="border border-onda-border">
        <h2 className="font-condensed font-bold uppercase text-onda-accent text-lg px-4 py-3 border-b border-onda-border bg-white">
          Wine Details
        </h2>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Style <span className="text-red-500">*</span>
              </label>
              <select
                value={form.colour_style}
                onChange={(e) => setForm({ ...form, colour_style: e.target.value })}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              >
                <option value="">Select style...</option>
                {COLOUR_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Region
              </label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Producer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.producer}
                onChange={(e) => setForm({ ...form, producer: e.target.value })}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Wine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Vintage
              </label>
              <input
                type="text"
                value={form.vintage}
                onChange={(e) => setForm({ ...form, vintage: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Grapes
              </label>
              <input
                type="text"
                value={form.grapes}
                onChange={(e) => setForm({ ...form, grapes: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Importer
              </label>
              <input
                type="text"
                value={form.importer}
                onChange={(e) => setForm({ ...form, importer: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Inventory Location
              </label>
              <input
                type="text"
                value={form.inventory_location}
                onChange={(e) => setForm({ ...form, inventory_location: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="border border-onda-border">
        <h2 className="font-condensed font-bold uppercase text-onda-accent text-lg px-4 py-3 border-b border-onda-border bg-white">
          Pricing
        </h2>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Sale Price
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => handleSalePriceChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent"
              />
            </div>
            <div>
              <label className="block font-condensed font-bold uppercase text-xs text-onda-muted mb-2">
                Glass Price
              </label>
              <input
                type="number"
                step="0.01"
                value={glassPrice}
                onChange={(e) => setGlassPrice(e.target.value)}
                disabled={loading || btg}
                className="w-full px-3 py-2 border border-onda-border bg-white font-condensed focus:outline-none focus:border-onda-accent disabled:bg-onda-surface"
              />
            </div>
          </div>

          {/* Markup Buttons */}
          <div>
            <p className="font-condensed font-bold uppercase text-xs text-onda-muted mb-2">Quick Markup</p>
            <div className="flex gap-2">
              {MARKUP_OPTIONS.map((markup) => (
                <button
                  key={markup}
                  type="button"
                  onClick={() => handleMarkupClick(markup)}
                  disabled={loading || !costPrice}
                  className="flex-1 px-3 py-2 border border-onda-border bg-white text-onda-text font-condensed font-bold uppercase text-xs hover:bg-onda-surface disabled:opacity-50 transition"
                >
                  {markup}×
                </button>
              ))}
            </div>
          </div>

          {/* BTG Checkbox */}
          <label className="flex items-center gap-2 font-condensed text-sm">
            <input type="checkbox" checked={btg} onChange={(e) => handleBtgChange(e.target.checked)} disabled={loading} />
            <span className="font-bold uppercase text-onda-muted">BTG (By The Glass)</span>
          </label>
        </div>
      </div>

      {/* Status Section */}
      <div className="border border-onda-border">
        <h2 className="font-condensed font-bold uppercase text-onda-accent text-lg px-4 py-3 border-b border-onda-border bg-white">
          Status
        </h2>
        <div className="p-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-condensed text-sm">
              <input
                type="radio"
                name="status"
                value="Active"
                checked={form.status === 'Active'}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                disabled={loading}
              />
              <span className="font-bold uppercase text-onda-text">Active</span>
            </label>
            <label className="flex items-center gap-2 font-condensed text-sm">
              <input
                type="radio"
                name="status"
                value="Inactive"
                checked={form.status === 'Inactive'}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                disabled={loading}
              />
              <span className="font-bold uppercase text-onda-text">Inactive</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-onda-accent text-white font-condensed font-bold uppercase text-sm hover:opacity-85 disabled:opacity-50 transition"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Wine' : 'Add Wine'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 px-6 py-3 border border-onda-border text-onda-text font-condensed font-bold uppercase text-sm hover:bg-onda-surface disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
