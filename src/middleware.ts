
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const sessionCookie = request.cookies.get('session')?.value;
  console.log('Session Cookie from middleware:', sessionCookie);
  console.log('Decoded Session from middleware:', session);

  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/admin', '/manager', '/waiter', '/kitchen'];
  const publicRoutes = ['/login', '/signup', '/unauthorized'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect any requests to /signup to the login page
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is no session and the user is trying to access a protected route,
  // redirect them to the login page.
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a session, handle role-based access and redirects
  if (session) {
    // If the user is logged in and tries to access a public route like /login or /signup,
    // redirect them to their dashboard.
    if (publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }
    
    // If the user is at the root, redirect them to their dashboard
    if (pathname === '/') {
       return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }

    // Role-based access control for protected routes
    if (pathname.startsWith('/admin') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/manager') && !['admin', 'manager'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/waiter') && !['admin', 'waiter'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
     if (pathname.startsWith('/kitchen') && !['admin', 'kitchen'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

  } else {
      // If there's no session and the user is at the root, redirect to login
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
