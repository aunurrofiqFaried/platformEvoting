'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Mail, Github } from 'lucide-react'
import bcrypt from 'bcryptjs'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation
      if (!email.trim()) {
        throw new Error('Email is required')
      }

      if (!fullName.trim()) {
        throw new Error('Full name is required')
      }

      if (fullName.length < 3) {
        throw new Error('Full name must be at least 3 characters')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Hash password
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Insert user ke database (id auto-generate)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          full_name: fullName,
          password_hash: hashedPassword,
          role: 'member',
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          throw new Error('Email already registered')
        }
        throw new Error(insertError.message)
      }

      if (!newUser) {
        throw new Error('Failed to create user')
      }

      setSuccess(true)
      setEmail('')
      setFullName('')
      setPassword('')
      setConfirmPassword('')

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    try {
      setOauthLoading(provider)
      setError('')

      const redirectURL = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectURL,
        },
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${provider} signup failed`
      setError(errorMessage)
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-slate-950 dark:to-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animation-delay-4000" />

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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Account created successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          {/* OAuth Options */}
          {/* <div className="space-y-3"> */}
            {/* <Button
              type="button"
              onClick={() => handleOAuthSignup('google')}
              disabled={loading || success || oauthLoading !== null}
              className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {oauthLoading === 'google' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing up with Google...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Continue with Google
                </>
              )}
            </Button> */}

            {/* <Button
              type="button"
              onClick={() => handleOAuthSignup('github')}
              disabled={loading || success || oauthLoading !== null}
              className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {oauthLoading === 'github' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing up with GitHub...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Continue with GitHub
                </>
              )}
            </Button> */}
          {/* </div> */}

          {/* Divider */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                Or signup with email
              </span>
            </div>
          </div> */}

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Full Name
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={loading || success || oauthLoading !== null}
                className="h-10 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

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
                disabled={loading || success || oauthLoading !== null}
                className="h-10 dark:bg-slate-800 dark:border-slate-700"
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
                  disabled={loading || success || oauthLoading !== null}
                  className="h-10 dark:bg-slate-800 dark:border-slate-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success || oauthLoading !== null}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
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
                  disabled={loading || success || oauthLoading !== null}
                  className="h-10 dark:bg-slate-800 dark:border-slate-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || success || oauthLoading !== null}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success || oauthLoading !== null}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-500 dark:text-slate-500">
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