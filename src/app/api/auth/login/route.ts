import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Login attempt for:', email)

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get user dari database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, email, full_name, password_hash, role')
      .eq('email', email.toLowerCase())
      .single()

    console.log('User query result:', { user, queryError })

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user has password_hash (email/password login)
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'This account uses OAuth login. Please use Google or GitHub.' },
        { status: 401 }
      )
    }

    // Verify password
    console.log('Comparing password...')
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    console.log('Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email)

    console.log('Login successful for:', user.email)

    // Return user info dan token
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        token: token,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}