'use client'

import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'admin' | 'member'
  userName?: string
  userEmail?: string
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          // Desktop
          collapsed ? 'lg:pl-16' : 'lg:pl-64',
          // Mobile - no padding when sidebar is closed
          'pl-0'
        )}
      >
        {/* Navbar */}
        <Navbar
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}