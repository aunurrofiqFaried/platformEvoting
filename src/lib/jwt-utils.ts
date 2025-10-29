/**
 * JWT Token Utilities
 * Gunakan di API route atau server action
 * 
 * Install: npm install jsonwebtoken @types/jsonwebtoken
 */

import jwt from 'jsonwebtoken'

interface TokenPayload {
  sub: string // user id
  email: string
  iat: number
  exp: number
}

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-change-in-production'
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days

/**
 * Generate JWT token untuk user
 * Gunakan di backend/API route
 */
export function generateToken(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000)
  
  const payload: TokenPayload = {
    sub: userId,
    email: email,
    iat: now,
    exp: now + TOKEN_EXPIRY,
  }

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
  })
}

/**
 * Verify JWT token
 * Gunakan di backend/API route
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })
    return decoded as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Decode token tanpa verify
 * Gunakan untuk debug
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token)
    return decoded as TokenPayload
  } catch (error) {
    console.error('Token decode failed:', error)
    return null
  }
}