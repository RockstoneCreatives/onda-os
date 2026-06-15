'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { WineForm } from '@/components/wine-form'

export default function AddWinePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex justify-between items-center">
          <Link href="/wines" className="text-onda-red font-medium hover:opacity-80">
            ← Back to Wines
          </Link>
          <h1 className="text-2xl font-bold text-onda-900">Add New Wine</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-8">
        <WineForm />
      </main>
    </div>
  )
}
