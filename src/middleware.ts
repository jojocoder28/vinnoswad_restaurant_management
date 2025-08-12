import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession, updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/login', '/signup'];

  if (publicRoutes.includes(pathname)) {
    if (session) {
        return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Check role-based access
  if (pathname.startsWith('/admin') && session.role !== 'admin') {
     return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/manager') && session.role !== 'manager') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/waiter') && session.role !== 'waiter') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
