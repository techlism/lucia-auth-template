import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateRequest } from "@/lib/lucia"

export async function middleware(request: NextRequest) {
  // Allow access to the homepage without authentication
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  const { session } = await validateRequest();

  // Redirect to sign-in if not authenticated and not already on sign-in or sign-up page
  if (!session && !request.nextUrl.pathname.startsWith('/sign-in') && !request.nextUrl.pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Redirect to dashboard if authenticated and trying to access sign-in or sign-up pages
  if (session && (request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}