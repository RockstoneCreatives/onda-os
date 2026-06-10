'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Stats {
  totalWines: number
  activeWines: number
  inactiveWines: number
  menusCreated: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalWines: 0,
    activeWines: 0,
    inactiveWines: 0,
    menusCreated: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check auth
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        // Fetch wine counts
        const [allWines, activeWinesResp, inactiveWinesResp, menusResp] =
          await Promise.all([
            supabase.from('wines').select('id', { count: 'exact' }),
            supabase
              .from('wines')
              .select('id', { count: 'exact' })
              .eq('status', 'Active'),
            supabase
              .from('wines')
              .select('id', { count: 'exact' })
              .eq('status', 'Inactive'),
            supabase.from('menus').select('id', { count: 'exact' }),
          ])

        setStats({
          totalWines: allWines.count || 0,
          activeWines: activeWinesResp.count || 0,
          inactiveWines: inactiveWinesResp.count || 0,
          menusCreated: menusResp.count || 0,
        })
      } catch (err) {
        const error = err as Error
        toast.error('Failed to load dashboard stats')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-onda-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-onda-accent">Onda OS</h1>
            <p className="text-slate-600 text-sm mt-1">Wine Management System</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-onda-border text-slate-700 rounded-lg hover:bg-onda-surface transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-onda-surface rounded-lg border border-onda-border p-6">
                <p className="text-slate-600 text-sm font-medium">Total Wines</p>
                <p className="text-4xl font-bold text-onda-accent mt-2">
                  {stats.totalWines}
                </p>
              </div>
              <div className="bg-onda-surface rounded-lg border border-onda-border p-6">
                <p className="text-slate-600 text-sm font-medium">Active Wines</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">
                  {stats.activeWines}
                </p>
              </div>
              <div className="bg-onda-surface rounded-lg border border-onda-border p-6">
                <p className="text-slate-600 text-sm font-medium">Inactive Wines</p>
                <p className="text-4xl font-bold text-slate-600 mt-2">
                  {stats.inactiveWines}
                </p>
              </div>
              <div className="bg-onda-surface rounded-lg border border-onda-border p-6">
                <p className="text-slate-600 text-sm font-medium">Menus Created</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">
                  {stats.menusCreated}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wine Management */}
              <div className="bg-white rounded-lg border border-onda-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Wine Management
                </h2>
                <p className="text-slate-600 mb-6">
                  Browse, add, edit, and manage your wine inventory with all
                  details from the master list.
                </p>
                <Link
                  href="/wines"
                  className="inline-block px-6 py-2 bg-onda-accent text-white font-medium rounded-lg hover:opacity-90 transition"
                >
                  Browse Wine List →
                </Link>
              </div>

              {/* Menu Builder */}
              <div className="bg-white rounded-lg border border-onda-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Create Menu
                </h2>
                <p className="text-slate-600 mb-6">
                  Build a new menu by selecting wines. They'll automatically
                  group by style and country for the PDF export.
                </p>
                <Link
                  href="/menus/new"
                  className="inline-block px-6 py-2 bg-onda-accent text-white font-medium rounded-lg hover:opacity-90 transition"
                >
                  Create New Menu →
                </Link>
              </div>

              {/* Menu History */}
              <div className="bg-white rounded-lg border border-onda-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Menu History
                </h2>
                <p className="text-slate-600 mb-6">
                  View and export menus you've created previously. Re-export
                  PDFs or create variations.
                </p>
                <Link
                  href="/menus"
                  className="inline-block px-6 py-2 bg-onda-accent text-white font-medium rounded-lg hover:opacity-90 transition"
                >
                  View Menu History →
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
