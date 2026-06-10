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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading wine...</p>
        </div>
      </div>
    )
  }

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Wine not found</p>
          <Link href="/wines" className="text-onda-accent hover:underline font-medium">
            Back to Wines
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-onda-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/wines" className="text-onda-accent font-bold text-lg hover:opacity-80">
            ← Back to Wines
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Edit Wine</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <WineForm wine={wine} isEditing />
      </main>
    </div>
  )
}
