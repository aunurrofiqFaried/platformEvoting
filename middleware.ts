import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes yang tidak perlu auth
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/']

  // Cek apakah ini public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Cek auth
  const authToken = request.cookies.get('authToken')?.value

  // Jika bukan public route dan tidak ada token, redirect ke login
  if (!isPublicRoute && !authToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Jika sudah login dan coba akses login/signup, redirect ke dashboard
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}