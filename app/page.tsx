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
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          router.push('/login')
          return
        }

        const [allWines, activeWinesResp, inactiveWinesResp, menusResp] = await Promise.all([
          supabase.from('wines').select('id', { count: 'exact' }),
          supabase.from('wines').select('id', { count: 'exact' }).eq('status', 'Active'),
          supabase.from('wines').select('id', { count: 'exact' }).eq('status', 'Inactive'),
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

  return (
    <div className="ml-64 min-h-screen bg-onda-50">
      {/* Header */}
      <div className="border-b border-onda-200 bg-white">
        <div className="px-8 py-8">
          <h1 className="text-4xl font-bold text-onda-primary">Dashboard - FIGMA REDESIGN v2</h1>
          <p className="text-onda-500 mt-2 text-base">Manage your wine inventory and create menus</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-accent"></div>
            </div>
            <p className="mt-4 text-onda-500">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="animate-slide-up bg-white rounded-xl border border-onda-200 p-6 shadow-sm hover:shadow-md transition-all">
                <p className="text-sm font-medium text-onda-500">Total Wines</p>
                <p className="text-4xl font-bold text-onda-primary mt-3">{stats.totalWines}</p>
                <div className="mt-4 h-1 w-12 bg-onda-accent rounded-full"></div>
              </div>
              <div className="animate-slide-up bg-white rounded-xl border border-onda-200 p-6 shadow-sm hover:shadow-md transition-all" style={{ animationDelay: '0.1s' }}>
                <p className="text-sm font-medium text-onda-500">Active Wines</p>
                <p className="text-4xl font-bold text-emerald-600 mt-3">{stats.activeWines}</p>
                <div className="mt-4 h-1 w-12 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="animate-slide-up bg-white rounded-xl border border-onda-200 p-6 shadow-sm hover:shadow-md transition-all" style={{ animationDelay: '0.2s' }}>
                <p className="text-sm font-medium text-onda-500">Inactive Wines</p>
                <p className="text-4xl font-bold text-onda-primary mt-3">{stats.inactiveWines}</p>
                <div className="mt-4 h-1 w-12 bg-onda-primary rounded-full"></div>
              </div>
              <div className="animate-slide-up bg-white rounded-xl border border-onda-200 p-6 shadow-sm hover:shadow-md transition-all" style={{ animationDelay: '0.3s' }}>
                <p className="text-sm font-medium text-onda-500">Menus Created</p>
                <p className="text-4xl font-bold text-onda-accent mt-3">{stats.menusCreated}</p>
                <div className="mt-4 h-1 w-12 bg-onda-accent rounded-full"></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-onda-primary mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Browse Wines */}
                <Link href="/wines" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-accent transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-accent group-hover:bg-opacity-10 transition">🍷</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-accent transition">Browse Wines</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Explore and search your complete wine inventory with detailed information.
                    </p>
                    <p className="text-onda-accent text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      View wines <span>→</span>
                    </p>
                  </div>
                </Link>

                {/* Create Menu */}
                <Link href="/menus/new" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-accent transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-secondary flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-accent group-hover:bg-opacity-10 transition">✨</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-accent transition">Create Menu</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Build a new wine menu by selecting and organizing wines from your list.
                    </p>
                    <p className="text-onda-accent text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Create new <span>→</span>
                    </p>
                  </div>
                </Link>

                {/* Menu History */}
                <Link href="/menus" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-accent transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-accent group-hover:bg-opacity-10 transition">📋</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-accent transition">Menu History</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      View, edit, and export all previously created wine menus.
                    </p>
                    <p className="text-onda-accent text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Browse menus <span>→</span>
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
