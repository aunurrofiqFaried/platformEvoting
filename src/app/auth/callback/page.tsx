'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async (): Promise<void> => {
      await supabase.auth.getSession()
      router.push('/dashboard')
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Processing login...</p>
      </div>
    </div>
  )
}