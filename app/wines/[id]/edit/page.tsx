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

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-accent mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading wine...</p>
        </div>
      </div>
    )
  }

  if (!wine) {
    return (
      <div className="ml-64 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Wine not found</p>
          <Link href="/wines" className="text-onda-accent hover:opacity-80 font-medium">
            Back to Wines
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex justify-between items-center">
          <Link href="/wines" className="text-onda-accent font-medium hover:opacity-80">
            ← Back to Wines
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Edit Wine</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-8">
        <WineForm wine={wine} isEditing />
      </main>
    </div>
  )
}
