'use client'

import { Bell, Search, User, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  userName?: string
  userEmail?: string
  onMenuClick: () => void
}

export function Navbar({ userName, userEmail, onMenuClick }: NavbarProps) {
  const router = useRouter()

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Side - Hamburger Menu (Mobile) */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden sm:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search Button - Mobile only */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="w-5 h-5" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9 px-2 md:px-3">
                <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userEmail || 'user@example.com'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}