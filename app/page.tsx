'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MainContent } from '@/components/main-content'

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
    <MainContent>
      <div>
      {/* Header */}
      <div className="border-b border-onda-200 bg-white">
        <div className="px-8 py-8">
          <h1 className="text-5xl font-bold text-onda-primary tracking-tight">ONDA OS</h1>
          <div className="mt-1 h-1 w-16 bg-onda-red rounded-full"></div>
          <p className="text-onda-500 mt-4 text-base">Manage your wine inventory and create menus</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-red"></div>
            </div>
            <p className="mt-4 text-onda-500">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="animate-slide-up bg-white rounded-lg border border-onda-200 border-l-4 border-l-onda-red p-6 hover:shadow-md transition-all">
                <p className="text-xs uppercase tracking-widest font-semibold text-onda-500">Total Wines</p>
                <p className="text-5xl font-bold text-onda-primary mt-4">{stats.totalWines}</p>
              </div>
              <div className="animate-slide-up bg-white rounded-lg border border-onda-200 border-l-4 border-l-emerald-500 p-6 hover:shadow-md transition-all" style={{ animationDelay: '0.1s' }}>
                <p className="text-xs uppercase tracking-widest font-semibold text-onda-500">Active Wines</p>
                <p className="text-5xl font-bold text-emerald-600 mt-4">{stats.activeWines}</p>
              </div>
              <div className="animate-slide-up bg-white rounded-lg border border-onda-200 border-l-4 border-l-onda-red p-6 hover:shadow-md transition-all" style={{ animationDelay: '0.2s' }}>
                <p className="text-xs uppercase tracking-widest font-semibold text-onda-500">Inactive Wines</p>
                <p className="text-5xl font-bold text-onda-primary mt-4">{stats.inactiveWines}</p>
              </div>
              <div className="animate-slide-up bg-white rounded-lg border border-onda-200 border-l-4 border-l-onda-red p-6 hover:shadow-md transition-all" style={{ animationDelay: '0.3s' }}>
                <p className="text-xs uppercase tracking-widest font-semibold text-onda-500">Menus Created</p>
                <p className="text-5xl font-bold text-onda-red mt-4">{stats.menusCreated}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-16">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-onda-500 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Browse Wines */}
                <Link href="/wines" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-red transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-red group-hover:bg-opacity-10 transition">🍷</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-red transition">Browse Wines</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Explore and search your complete wine inventory with detailed information.
                    </p>
                    <p className="text-onda-red text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      View wines <span>→</span>
                    </p>
                  </div>
                </Link>

                {/* Create Menu */}
                <Link href="/menus/new" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-red transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-red group-hover:bg-opacity-10 transition">✨</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-red transition">Create Menu</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Build a new wine menu by selecting and organizing wines from your list.
                    </p>
                    <p className="text-onda-red text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Create new <span>→</span>
                    </p>
                  </div>
                </Link>

                {/* Menu History */}
                <Link href="/menus" className="group">
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md hover:border-onda-red transition-all h-full">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-onda-red group-hover:bg-opacity-10 transition">📋</div>
                    <h3 className="text-lg font-semibold text-onda-primary group-hover:text-onda-red transition">Menu History</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      View, edit, and export all previously created wine menus.
                    </p>
                    <p className="text-onda-red text-sm font-semibold mt-4 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Browse menus <span>→</span>
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Phase 2 Features */}
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-onda-500">Coming Soon — Phase 2</h2>
                <span className="bg-onda-blue text-white text-xs px-2 py-1 rounded font-medium">Phase 2</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tebi Sync */}
                <button
                  onClick={() => toast.info('Tebi integration is coming in Phase 2. Stay tuned!')}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md transition-all h-full opacity-60 hover:opacity-75 cursor-not-allowed text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4">🔗</div>
                        <h3 className="text-lg font-semibold text-onda-primary">Tebi Sync</h3>
                        <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                          Connect your POS system for automatic wine inventory sync.
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Analytics */}
                <button
                  onClick={() => toast.info('Analytics dashboard is coming in Phase 2. Stay tuned!')}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md transition-all h-full opacity-60 hover:opacity-75 cursor-not-allowed text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold text-onda-primary">Analytics Dashboard</h3>
                        <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                          View sales trends, popular wines, and menu performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Phase 3 Features */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-onda-500">Coming Soon — Phase 3</h2>
                <span className="bg-onda-blue text-white text-xs px-2 py-1 rounded font-medium">Phase 3</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Google Drive Sync */}
                <button
                  onClick={() => toast.info('Google Drive sync is coming in Phase 3. Stay tuned!')}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md transition-all h-full opacity-60 hover:opacity-75 cursor-not-allowed text-left">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4">📁</div>
                    <h3 className="text-lg font-semibold text-onda-primary">Google Drive Sync</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Automatically export menus and wine lists to your Google Drive as formatted documents.
                    </p>
                  </div>
                </button>

                {/* AI Sommelier */}
                <button
                  onClick={() => toast.info('AI Sommelier is coming in Phase 3. Stay tuned!')}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md transition-all h-full opacity-60 hover:opacity-75 cursor-not-allowed text-left">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-onda-primary">AI Sommelier</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Chat-based wine recommendations, food pairing suggestions, and guest-facing descriptions powered by AI.
                    </p>
                  </div>
                </button>

                {/* Supplier Catalogue */}
                <button
                  onClick={() => toast.info('Supplier catalogue is coming in Phase 3. Stay tuned!')}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-onda-200 p-8 shadow-sm hover:shadow-md transition-all h-full opacity-60 hover:opacity-75 cursor-not-allowed text-left">
                    <div className="h-12 w-12 rounded-lg bg-onda-100 flex items-center justify-center text-2xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-onda-primary">Supplier Catalogue</h3>
                    <p className="text-onda-500 text-sm mt-2 leading-relaxed">
                      Browse your suppliers' current stock, compare wines, and sync new arrivals directly into your inventory.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </MainContent>
  )
}
