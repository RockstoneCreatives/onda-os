'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSidebar } from '@/contexts/sidebar-context'

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const [wineManagementOpen, setWineManagementOpen] = useState(true)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const isActive = (path: string) => {
    if (path === '/wines') {
      return pathname === '/wines' || (pathname.startsWith('/wines/') && !pathname.startsWith('/wines/inventory'))
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

  const wineManagementItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/wines', label: 'Wines' },
    { href: '/wines/inventory', label: 'Inventory' },
    { href: '/menus', label: 'Menus' },
  ]

  const isWineManagementActive = wineManagementItems.some(item => isActive(item.href))

  return (
    <aside className={`bg-white border-r border-onda-200 flex flex-col fixed left-0 top-0 h-screen print:hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className={`px-4 py-8 border-b border-onda-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link href="/" className="text-2xl font-black text-onda-red hover:opacity-80 transition tracking-widest flex-1">
            ONDA OS
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 text-onda-700 hover:text-onda-red hover:bg-onda-50 rounded-lg transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-2">
        {/* Wine Management Section */}
        <div>
          <button
            onClick={() => setWineManagementOpen(!wineManagementOpen)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition text-xs font-semibold uppercase tracking-wide ${
              isWineManagementActive
                ? 'border-l-4 border-onda-red bg-onda-100 text-onda-red'
                : 'border-l-4 border-transparent text-onda-700 hover:text-onda-red hover:bg-onda-50'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            {!isCollapsed && 'Wine Management'}
            {!isCollapsed && <span className={`ml-auto transition-transform ${wineManagementOpen ? 'rotate-180' : ''}`}>▼</span>}
            {isCollapsed && <span>🍇</span>}
          </button>

          {/* Wine Management Items */}
          {wineManagementOpen && !isCollapsed && (
            <div className="space-y-1 mt-2 ml-4 border-l-2 border-onda-100 pl-0">
              {wineManagementItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition text-xs font-medium uppercase tracking-wide ${
                      active
                        ? 'text-onda-red bg-onda-50'
                        : 'text-onda-600 hover:text-onda-red hover:bg-onda-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="px-2 py-6 border-t border-onda-200">
        <button
          onClick={handleSignOut}
          className={`w-full px-4 py-2.5 text-onda-primary hover:text-onda-red hover:bg-onda-50 rounded-lg transition text-sm font-medium ${isCollapsed ? 'text-xs px-1' : ''}`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          {isCollapsed ? '⏻' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
