import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude static assets and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow access to login page
  if (pathname === '/login') {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('admin_session')?.value
  const session = await verifyToken(sessionCookie)

  // Redirect to login if not authenticated
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
