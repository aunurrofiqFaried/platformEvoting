import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    return NextResponse.json(
      { hashedPassword },
      { status: 200 }
    )
  } catch (error) {
    console.error('Hash password error:', error)
    return NextResponse.json(
      { error: 'Failed to hash password' },
      { status: 500 }
    )
  }
}