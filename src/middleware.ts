import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/signup', '/unauthorized'];

  // If trying to access the root, redirect based on session
  if (pathname === '/') {
    if (session) {
        return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    } else {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow access to public routes if not logged in, but not the root
  if (!session && publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If no session and trying to access a protected route, redirect to login
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a session, handle redirects
  if (session) {
    // If logged in user is trying to access a public route, redirect them to their dashboard
    if (publicRoutes.includes(pathname)) {
       return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }

    // Check role-based access for protected routes
    if (pathname.startsWith('/admin') && session.role !== 'admin') {
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/manager') && (session.role !== 'manager' && session.role !== 'admin')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    // Allow admin to access waiter page if needed, otherwise restrict
    if (pathname.startsWith('/waiter') && (session.role !== 'waiter' && session.role !== 'admin')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
