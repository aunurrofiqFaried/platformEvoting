import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Public routes yang tidak perlu auth
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/forgot-password',
    '/',
    '/terms',
    '/privacy',
  ]

  // Cek apakah ini public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname.startsWith(route)
  })

  // Cek auth dari cookie
  const authToken = request.cookies.get('authToken')?.value

  console.log(`[Middleware] Path: ${pathname}, Auth: ${!!authToken}, Public: ${isPublicRoute}`)

  // Jika bukan public route dan tidak ada token, redirect ke login dengan redirect parameter
  if (!isPublicRoute && !authToken) {
    console.log(`[Middleware] Redirecting to login with redirect=${pathname}${search}`)
    const redirectUrl = pathname + search
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', redirectUrl)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login dan coba akses login/signup, redirect ke dashboard
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && authToken) {
    console.log(`[Middleware] User logged in, redirecting to dashboard`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}