'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'

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

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onda-accent mx-auto"></div>
            <p className="mt-4 text-onda-muted font-condensed">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Main Heading */}
            <h1 className="font-condensed font-bold uppercase text-5xl text-onda-accent mb-12">
              Dashboard
            </h1>

            {/* Stats Row */}
            <div className="flex gap-8 mb-16 border-b border-onda-border pb-8">
              <div>
                <p className="font-condensed uppercase text-sm text-onda-muted tracking-wide">Total Wines</p>
                <p className="font-condensed font-bold text-4xl text-onda-accent mt-1">
                  {stats.totalWines}
                </p>
              </div>
              <div>
                <p className="font-condensed uppercase text-sm text-onda-muted tracking-wide">Active</p>
                <p className="font-condensed font-bold text-4xl text-onda-text mt-1">
                  {stats.activeWines}
                </p>
              </div>
              <div>
                <p className="font-condensed uppercase text-sm text-onda-muted tracking-wide">Inactive</p>
                <p className="font-condensed font-bold text-4xl text-onda-text mt-1">
                  {stats.inactiveWines}
                </p>
              </div>
              <div>
                <p className="font-condensed uppercase text-sm text-onda-muted tracking-wide">Menus</p>
                <p className="font-condensed font-bold text-4xl text-onda-text mt-1">
                  {stats.menusCreated}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-8">
              {/* Wine Management */}
              <div>
                <h2 className="font-condensed font-bold uppercase text-2xl text-onda-accent mb-4">
                  Wine Management
                </h2>
                <p className="text-onda-text font-condensed mb-4 max-w-2xl">
                  Browse, add, edit, and manage your wine inventory with all details from the master list.
                </p>
                <Link
                  href="/wines"
                  className="inline-block font-condensed font-bold uppercase text-onda-accent hover:text-onda-text transition"
                >
                  Browse Wine List →
                </Link>
              </div>

              {/* Menu Builder */}
              <div>
                <h2 className="font-condensed font-bold uppercase text-2xl text-onda-accent mb-4">
                  Create Menu
                </h2>
                <p className="text-onda-text font-condensed mb-4 max-w-2xl">
                  Build a new menu by selecting wines. They'll automatically group by style and country for the PDF export.
                </p>
                <Link
                  href="/menus/new"
                  className="inline-block font-condensed font-bold uppercase text-onda-accent hover:text-onda-text transition"
                >
                  Create New Menu →
                </Link>
              </div>

              {/* Menu History */}
              <div>
                <h2 className="font-condensed font-bold uppercase text-2xl text-onda-accent mb-4">
                  Menu History
                </h2>
                <p className="text-onda-text font-condensed mb-4 max-w-2xl">
                  View and export menus you've created previously. Re-export PDFs or create variations.
                </p>
                <Link
                  href="/menus"
                  className="inline-block font-condensed font-bold uppercase text-onda-accent hover:text-onda-text transition"
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
