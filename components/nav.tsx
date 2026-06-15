'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NavProps {
  currentPage?: 'wines' | 'menus' | 'create'
}

export function Nav({ currentPage }: NavProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const isActive = (page: string) => currentPage === page

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-onda-border">
      <div className="w-full h-16 flex">
        {/* Wines */}
        <div className="flex-1 flex items-center justify-center border-r border-onda-border">
          <Link
            href="/wines"
            className={`font-condensed font-bold uppercase text-lg tracking-tight transition ${
              isActive('wines') ? 'text-onda-accent' : 'text-onda-text hover:text-onda-accent'
            }`}
          >
            Wines
          </Link>
        </div>

        {/* Menus */}
        <div className="flex-1 flex items-center justify-center border-r border-onda-border">
          <Link
            href="/menus"
            className={`font-condensed font-bold uppercase text-lg tracking-tight transition ${
              isActive('menus') ? 'text-onda-accent' : 'text-onda-text hover:text-onda-accent'
            }`}
          >
            Menus
          </Link>
        </div>

        {/* Create Menu */}
        <div className="flex-1 flex items-center justify-center border-r border-onda-border">
          <Link
            href="/menus/new"
            className={`font-condensed font-bold uppercase text-lg tracking-tight transition ${
              isActive('create') ? 'text-onda-accent' : 'text-onda-text hover:text-onda-accent'
            }`}
          >
            + Create Menu
          </Link>
        </div>

        {/* Sign Out */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={handleSignOut}
            className="font-condensed font-bold uppercase text-lg text-onda-text hover:text-onda-accent transition tracking-tight"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
