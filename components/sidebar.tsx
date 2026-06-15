'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const navItems = [
    { href: '/', label: 'Dashboard', pattern: ['/', '/page'] },
    { href: '/wines', label: 'Wines', pattern: ['/wines'] },
    { href: '/wines/inventory', label: 'Inventory', pattern: ['/wines/inventory'] },
    { href: '/menus', label: 'Menus', pattern: ['/menus'] },
  ]

  return (
    <aside className="w-64 bg-onda-primary border-r border-onda-300 flex flex-col fixed left-0 top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-onda-300">
        <Link href="/" className="text-2xl font-bold text-onda-accent hover:opacity-80 transition">
          Onda OS
        </Link>
        <p className="text-xs text-onda-400 mt-1">Wine Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg transition text-sm font-medium ${
                active
                  ? 'bg-onda-accent bg-opacity-15 text-onda-accent'
                  : 'text-onda-300 hover:bg-onda-700 hover:text-onda-accent'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-4 py-6 border-t border-onda-300">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2.5 text-onda-300 hover:bg-onda-700 hover:text-onda-accent rounded-lg transition text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
