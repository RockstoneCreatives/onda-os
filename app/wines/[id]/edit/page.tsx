'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { WineForm } from '@/components/wine-form'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/client'

type Wine = Database['public']['Tables']['wines']['Row']

export default function EditWinePage() {
  const router = useRouter()
  const params = useParams()
  const wineId = params.id as string

  const [wine, setWine] = useState<Wine | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchWine = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase.from('wines').select('*').eq('id', wineId).single()

        if (error) throw error
        if (!data) {
          toast.error('Wine not found')
          router.push('/wines')
          return
        }

        setWine(data)
      } catch (err) {
        const error = err as Error
        toast.error('Failed to load wine')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchWine()
  }, [wineId, router])

  const handleDelete = async () => {
    if (!wine) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${wine.producer} - ${wine.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('wines').delete().eq('id', wine.id)
      if (error) throw error
      toast.success('Wine deleted')
      router.push('/wines')
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Failed to delete wine')
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red mx-auto"></div>
          <p className="mt-4 text-onda-500">Loading wine...</p>
        </div>
      </div>
    )
  }

  if (!wine) {
    return (
      <div className="ml-64 min-h-screen bg-onda-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-onda-600 mb-4">Wine not found</p>
          <Link href="/wines" className="text-onda-red hover:opacity-80 font-medium">
            Back to Wines
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex justify-between items-center">
          <Link href="/wines" className="text-onda-red font-medium hover:opacity-80">
            ← Back to Wines
          </Link>
          <h1 className="text-2xl font-bold text-onda-900">Edit Wine</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-8">
        <WineForm wine={wine} isEditing />

        {/* Delete Section */}
        <div className="mt-12 pt-8 border-t border-onda-200">
          <h3 className="text-lg font-semibold text-onda-900 mb-3">Danger Zone</h3>
          <p className="text-sm text-onda-600 mb-4">
            Permanently delete this wine from the system. This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? 'Deleting...' : 'Delete Wine'}
          </button>
        </div>
      </main>
    </div>
  )
}
