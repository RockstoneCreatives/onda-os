'use client'

import { useSidebar } from '@/contexts/sidebar-context'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={`min-h-screen bg-onda-50 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {children}
    </div>
  )
}
