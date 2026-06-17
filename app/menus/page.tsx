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

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-onda-900">Menus</h1>
            <p className="text-onda-500 mt-1">View and manage your created menus.</p>
          </div>
          <Link
            href="/menus/new"
            className="px-4 py-2 bg-onda-red text-white rounded-lg hover:bg-onda-600 transition font-medium text-sm shadow-sm"
          >
            + Create Menu
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red"></div>
            </div>
            <p className="mt-4 text-onda-500">Loading menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="bg-white rounded-lg border border-onda-200 p-8 text-center shadow-xs">
            <p className="text-onda-600 mb-6">No menus created yet</p>
            <Link
              href="/menus/new"
              className="inline-block px-4 py-2 bg-onda-red text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Create Your First Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-lg border border-onda-200 p-6 shadow-xs hover:shadow-md transition flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-onda-900">{menu.title}</h3>
                  <p className="text-sm text-onda-500 mt-1">
                    {new Date(menu.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/menus/${menu.id}`}
                    className="px-4 py-2 bg-onda-red text-white rounded-lg font-medium text-sm hover:opacity-90 transition"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
