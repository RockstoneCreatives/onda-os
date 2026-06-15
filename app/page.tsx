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
    <div className="ml-64 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to Onda OS. Manage your wine inventory and menus.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onda-accent"></div>
            </div>
            <p className="mt-4 text-slate-500">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
                <p className="text-sm font-medium text-slate-600">Total Wines</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalWines}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
                <p className="text-sm font-medium text-slate-600">Active Wines</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeWines}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
                <p className="text-sm font-medium text-slate-600">Inactive Wines</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.inactiveWines}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
                <p className="text-sm font-medium text-slate-600">Menus Created</p>
                <p className="text-3xl font-bold text-onda-accent mt-2">{stats.menusCreated}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Browse Wines */}
              <Link href="/wines" className="group">
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">🍷</div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-onda-accent transition">Browse Wines</h3>
                  <p className="text-slate-600 text-sm mt-2">
                    View, search, and manage your complete wine inventory with all details from the master list.
                  </p>
                  <p className="text-onda-accent text-sm font-medium mt-4 group-hover:translate-x-1 transition">
                    Get started →
                  </p>
                </div>
              </Link>

              {/* Create Menu */}
              <Link href="/menus/new" className="group">
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-xl">📋</div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-onda-accent transition">Create Menu</h3>
                  <p className="text-slate-600 text-sm mt-2">
                    Build a new menu by selecting wines. They'll automatically organize and export as PDF.
                  </p>
                  <p className="text-onda-accent text-sm font-medium mt-4 group-hover:translate-x-1 transition">
                    Create new →
                  </p>
                </div>
              </Link>

              {/* Menu History */}
              <Link href="/menus" className="group">
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">📁</div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-onda-accent transition">Menu History</h3>
                  <p className="text-slate-600 text-sm mt-2">
                    View, edit, and export all menus you've created. Download PDFs or create variations.
                  </p>
                  <p className="text-onda-accent text-sm font-medium mt-4 group-hover:translate-x-1 transition">
                    Browse menus →
                  </p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
