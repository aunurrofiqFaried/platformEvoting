'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        // Get session dari Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(sessionError.message)
        }

        if (!sessionData?.session?.user) {
          throw new Error('No user found in session')
        }

        const user = sessionData.session.user

        if (!user.email) {
          throw new Error('User email is empty')
        }

        // Check/create user in database
        const { data: existingUser, error: dbError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', user.email)
          .maybeSingle()

        if (dbError && dbError.code !== 'PGRST116') {
          throw new Error(dbError.message)
        }

        // Create user if not exists
        if (!existingUser) {
          const fullName = user.user_metadata?.full_name || user.email.split('@')[0]
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              email: user.email,
              full_name: fullName,
              role: 'member',
              password_hash: null,
            })

          if (insertError && insertError.code !== '23505') {
            throw insertError
          }
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', sessionData.session.access_token)
          localStorage.setItem('userId', user.id)
          localStorage.setItem('userEmail', user.email)
          localStorage.setItem('userName', user.user_metadata?.full_name || user.email.split('@')[0])
          localStorage.setItem('userRole', existingUser?.role || 'member')

          // Set cookie
          document.cookie = `authToken=${sessionData.session.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`
        }

        if (!isMounted) return

        toast.success('Login successful!')

        // Redirect to dashboard
        router.push('/dashboard')
      } catch (err) {
        if (!isMounted) return

        const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
        console.error('Callback error:', err)

        setError(errorMessage)
        toast.error(errorMessage)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          if (isMounted) {
            router.push('/auth/login')
          }
        }, 3000)
      }
    }

    handleCallback()

    return () => {
      isMounted = false
    }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-600 dark:text-red-400 font-semibold">
              Authentication failed
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Completing your authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}