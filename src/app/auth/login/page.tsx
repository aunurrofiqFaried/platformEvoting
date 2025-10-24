'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find user by email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (fetchError || !user) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password)

      if (!isPasswordValid) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Simpan user info
      localStorage.setItem('user_id', user.id)
      localStorage.setItem('user_email', user.email)
      localStorage.setItem('user_username', user.username)
      localStorage.setItem('user_role', user.role)

      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) throw oauthError
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-slate-950 dark:to-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md border-orange-200 dark:border-slate-800 shadow-2xl relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-3xl text-center font-bold text-slate-900 dark:text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Password
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold shadow-lg shadow-orange-500/30"
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 text-base font-medium border-slate-300 dark:border-slate-700 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-slate-800 dark:text-white"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-4">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}