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
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-onda-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/wines" className="text-onda-accent font-bold text-lg hover:opacity-80">
            ← Back to Wines
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Add New Wine</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <WineForm />
      </main>
    </div>
  )
}
