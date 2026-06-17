'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSidebar } from '@/contexts/sidebar-context'

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed, toggleCollapsed } = useSidebar()

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

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/wines', label: 'Wines' },
    { href: '/wines/inventory', label: 'Inventory' },
    { href: '/menus', label: 'Menus' },
  ]

  return (
    <aside className={`bg-white border-r border-onda-200 flex flex-col fixed left-0 top-0 h-screen print:hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Collapse Button & Logo */}
      <div className={`px-4 py-6 border-b border-onda-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <Link href="/" className="text-2xl font-bold text-onda-red hover:opacity-80 transition tracking-widest block">
              ONDA OS
            </Link>
            <p className="text-xs text-onda-500 mt-2 uppercase tracking-widest font-semibold">Wine Management</p>
          </div>
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
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg transition text-xs font-semibold border-l-4 pl-3 uppercase tracking-wide ${
                active
                  ? 'border-onda-red bg-onda-100 text-onda-red'
                  : 'border-transparent text-onda-700 hover:text-onda-red hover:bg-onda-50'
              } ${isCollapsed ? 'text-center px-1 pl-1 truncate' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              {isCollapsed ? item.label.charAt(0).toUpperCase() : item.label}
            </Link>
          )
        })}
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
