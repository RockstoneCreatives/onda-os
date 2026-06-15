'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'
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

  return (
    <div className="min-h-screen bg-white">
      <Nav currentPage="menus" />

      <main className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        <h1 className="font-condensed font-bold uppercase text-5xl text-onda-accent mb-8">
          Menu History
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-onda-muted font-condensed">Loading menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="border border-onda-border p-8 text-center">
            <p className="text-onda-text font-condensed mb-6">No menus created yet</p>
            <Link
              href="/menus/new"
              className="inline-block px-4 py-2 bg-onda-accent text-white font-condensed font-bold uppercase text-sm hover:opacity-85 transition"
            >
              Create Your First Menu
            </Link>
          </div>
        ) : (
          <div className="border border-onda-border">
            {menus.map((menu, idx) => (
              <div
                key={menu.id}
                className={`flex justify-between items-center px-4 py-4 ${
                  idx !== menus.length - 1 ? 'border-b border-onda-border' : ''
                } hover:bg-onda-surface transition`}
              >
                <div>
                  <p className="font-condensed font-bold text-onda-text">
                    {menu.title}
                  </p>
                  <p className="font-condensed text-sm text-onda-muted mt-1">
                    {new Date(menu.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/menus/${menu.id}`}
                    className="px-3 py-2 border border-onda-border text-onda-accent font-condensed font-bold uppercase text-xs hover:bg-onda-surface transition"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="px-3 py-2 border border-red-300 text-red-600 font-condensed font-bold uppercase text-xs hover:bg-red-50 transition"
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
