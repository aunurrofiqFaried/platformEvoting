'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Navbar } from '@/components/dashboard/navbar'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
}

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async (): Promise<void> => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !userData) {
        console.error('Error fetching user:', error)
        router.push('/auth/login')
        return
      }

      setUser(userData)
      setLoading(false)
    }

    checkUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  // Initial loading - full screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:pl-16' : 'lg:pl-64',
          'pl-0'
        )}
      >
        {/* Navbar */}
        <Navbar
          userName={user.email?.split('@')[0] || 'User'}
          userEmail={user.email || ''}
          onMenuClick={() => setMobileOpen(true)}
        />

        {/* Page Content - This is where children render */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}