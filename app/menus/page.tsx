'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/client'

type Menu = Database['public']['Tables']['menus']['Row']

export default function MenusPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMenus(data || [])
      } catch (err) {
        const error = err as Error
        toast.error('Failed to load menus')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [router])

  const handleDelete = async (menuId: string) => {
    if (!confirm('Delete this menu?')) return

    try {
      const { error } = await supabase.from('menus').delete().eq('id', menuId)
      if (error) throw error
      toast.success('Menu deleted')
      setMenus(menus.filter((m) => m.id !== menuId))
    } catch (err) {
      const error = err as Error
      toast.error('Failed to delete menu')
      console.error(error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-onda-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-onda-accent font-bold text-lg hover:opacity-80">
              ← Back
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Menu History</h1>
          <div className="flex gap-4">
            <Link
              href="/menus/new"
              className="px-4 py-2 bg-onda-accent text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              + Create Menu
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-onda-border text-slate-700 rounded-lg hover:bg-onda-surface transition text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-16 bg-onda-surface rounded-lg border border-onda-border">
            <p className="text-slate-600 mb-6">No menus created yet</p>
            <Link
              href="/menus/new"
              className="inline-block px-6 py-2 bg-onda-accent text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              Create Your First Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <div key={menu.id} className="bg-white rounded-lg border border-onda-border p-6 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{menu.title}</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Created: {new Date(menu.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/menus/${menu.id}`}
                    className="flex-1 px-4 py-2 bg-onda-surface text-onda-accent rounded-lg hover:bg-white border border-onda-border text-center text-sm font-medium transition"
                  >
                    View & Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
