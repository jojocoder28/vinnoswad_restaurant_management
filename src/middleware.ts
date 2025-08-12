import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession, updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/signup', '/unauthorized'];

  // Redirect to role-specific page if logged in and trying to access a public route
  if (session && publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL(`/${session.role}`, request.url));
  }
  
  // If trying to access the root, redirect based on session
  if (pathname === '/') {
    if (session) {
        return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    } else {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow access to public routes if not logged in
  if (!session && publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If no session and not a public route, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Check role-based access for protected routes
  if (pathname.startsWith('/admin') && session.role !== 'admin') {
     return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/manager') && (session.role !== 'manager' && session.role !== 'admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/waiter') && (session.role !== 'waiter' && session.role !== 'admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  const response = NextResponse.next();
  // We are not calling updateSession here as it caused issues with cookies
  // Instead, the session is refreshed on every getSession call if it's close to expiring
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
