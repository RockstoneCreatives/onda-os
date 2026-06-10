'use client'

import { useState, useEffect } from 'react'
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
const COLOUR_STYLES = [
  'Sparkling',
  'Sweet',
  'Rosé',
  'Non-alcoholic',
  'White',
  'Orange/Skin Contact',
  'Red',
]

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
    // Auto-calc glass price if BTG
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
        const { error } = await supabase
          .from('wines')
          .update(payload)
          .eq('id', wine.id)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-onda-border p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Wine Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Style <span className="text-red-500">*</span>
            </label>
            <select
              value={form.colour_style}
              onChange={(e) => setForm({ ...form, colour_style: e.target.value })}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Producer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.producer}
              onChange={(e) => setForm({ ...form, producer: e.target.value })}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vintage</label>
            <input
              type="text"
              value={form.vintage}
              onChange={(e) => setForm({ ...form, vintage: e.target.value })}
              placeholder="e.g. 2024 or NV"
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Grapes</label>
            <input
              type="text"
              value={form.grapes}
              onChange={(e) => setForm({ ...form, grapes: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Importer</label>
            <input
              type="text"
              value={form.importer}
              onChange={(e) => setForm({ ...form, importer: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Inventory Location</label>
            <input
              type="text"
              value={form.inventory_location}
              onChange={(e) => setForm({ ...form, inventory_location: e.target.value })}
              placeholder="e.g. BCK, FR1, WF10"
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg border border-onda-border p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (€)</label>
            <input
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sale Price (€)</label>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => handleSalePriceChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Glass Price (€)</label>
            <input
              type="number"
              step="0.01"
              value={glassPrice}
              onChange={(e) => setGlassPrice(e.target.value)}
              disabled={loading || btg}
              className="w-full px-3 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent disabled:bg-onda-surface"
            />
          </div>
        </div>

        {/* Markup buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Quick Markup (from cost price):</p>
          <div className="flex flex-wrap gap-2">
            {MARKUP_OPTIONS.map((markup) => {
              const cost = parseFloat(costPrice)
              const result = isNaN(cost) ? '—' : '€' + (cost * markup).toFixed(2)
              return (
                <button
                  key={markup}
                  type="button"
                  onClick={() => handleMarkupClick(markup)}
                  disabled={loading || !costPrice}
                  className="px-4 py-2 bg-onda-surface border border-onda-border rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 transition"
                >
                  {markup}× = {result}
                </button>
              )
            })}
          </div>
        </div>

        {/* BTG checkbox */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={btg}
            onChange={(e) => handleBtgChange(e.target.checked)}
            disabled={loading}
            className="rounded"
          />
          <span className="text-sm font-medium text-slate-700">Available by the glass</span>
        </label>
        {btg && glassPrice && (
          <p className="text-xs text-slate-600 mt-2">Glass price auto-calculated: €{(parseFloat(salePrice) / 5.5).toFixed(2)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-onda-accent text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Wine' : 'Add Wine'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 border border-onda-border text-slate-700 font-medium rounded-lg hover:bg-onda-surface transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
