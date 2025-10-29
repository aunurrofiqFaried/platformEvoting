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
      try {
        // Small delay untuk ensure localStorage ready
        await new Promise(resolve => setTimeout(resolve, 50))

        // Check token dari localStorage (email/password login)
        const token = localStorage.getItem('authToken')
        const userId = localStorage.getItem('userId')
        const userEmail = localStorage.getItem('userEmail')
        const userRole = localStorage.getItem('userRole')

        console.log('Auth check:', { 
          hasToken: !!token, 
          hasUserId: !!userId, 
          hasEmail: !!userEmail,
          userEmail 
        })

        if (token && userId && userEmail) {
          // User dari localStorage (email/password)
          console.log('Using localStorage auth for:', userEmail)
          setUser({
            id: userId,
            email: userEmail,
            role: (userRole as 'admin' | 'member') || 'member',
          })
          setLoading(false)
          return
        }

        console.log('No localStorage auth, checking Supabase...')

        // Check Supabase auth (OAuth)
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        console.log('Supabase auth check:', { authUser: !!authUser, error: authError?.message })

        if (!authUser) {
          console.log('No auth found, redirecting to login')
          setLoading(false)
          router.push('/auth/login')
          return
        }

        // Get user dari database
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', authUser.id)
          .single()

        console.log('Database check:', { userData: !!userData, error: dbError?.message })

        if (dbError || !userData) {
          console.error('Error fetching user:', dbError)
          setLoading(false)
          router.push('/auth/login')
          return
        }

        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role || 'member',
        })
        setLoading(false)
      } catch (error) {
        console.error('Check user error:', error)
        setLoading(false)
        router.push('/auth/login')
      }
    }

    checkUser()

    // Subscribe to auth changes (untuk OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event)
      if (event === 'SIGNED_OUT') {
        // Clear localStorage juga
        localStorage.removeItem('authToken')
        localStorage.removeItem('userId')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        localStorage.removeItem('userRole')
        setUser(null)
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