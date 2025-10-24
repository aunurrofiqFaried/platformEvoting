'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!username.trim()) {
      setError('Username is required')
      setLoading(false)
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user in users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          role: 'member',
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          setError('Email or username already exists')
        } else {
          setError(insertError.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
      setUsername('')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
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
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-base">
            Get started with your free account today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg text-sm flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Account created successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
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
                disabled={loading || success}
                className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username (min 3 chars)"
                required
                disabled={loading || success}
                className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading || success}
                  className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading || success}
                  className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || success}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold shadow-lg shadow-orange-500/30"
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-4">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-500 dark:text-slate-500 pt-2">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-orange-600 hover:text-orange-700 underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}