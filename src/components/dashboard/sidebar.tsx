'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Vote, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface SidebarProps {
  userRole: 'admin' | 'member'
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function Sidebar({ userRole, collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  // Menu untuk Admin
  const adminMenuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Members',
      href: '/dashboard/members',
      icon: Users,
    },
    {
      title: 'Voting Rooms',
      href: '/dashboard/rooms',
      icon: Vote,
    },
    {
      title: 'Statistics',
      href: '/dashboard/statistics',
      icon: BarChart3,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  // Menu untuk Member
  const memberMenuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Rooms',
      href: '/dashboard/my-rooms',
      icon: Vote,
    },
    {
      title: 'Create Room',
      href: '/dashboard/create-room',
      icon: Vote,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  const menuItems = userRole === 'admin' ? adminMenuItems : memberMenuItems

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300',
          // Desktop
          'lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                E-Voting
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto">
              <Vote className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Button - Desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block absolute -right-3 top-20 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full items-center justify-center shadow-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 mx-auto" />
          ) : (
            <ChevronLeft className="w-4 h-4 mx-auto" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                  collapsed && 'lg:justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Role Badge */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="px-3 py-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Role
              </p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 capitalize">
                {userRole}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}