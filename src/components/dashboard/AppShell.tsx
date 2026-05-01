'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'

type Props = {
  userName: string
  userPlan: string
  children: React.ReactNode
}

export function AppShell({ userName, userPlan, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] bg-very-light-gray overflow-hidden">
      <Sidebar
        userName={userName}
        userPlan={userPlan}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-border flex-shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-medium-gray hover:text-primary-dark"
            aria-label="Buka menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-none">
          {children}
        </main>
      </div>
    </div>
  )
}
