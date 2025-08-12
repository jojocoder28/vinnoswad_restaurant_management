'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import type { User, DecodedToken } from './types';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // console.log(error); // Commented out to avoid logging expected errors
    return null;
  }
}

export async function getSession(): Promise<DecodedToken | null> {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  
  const session = await decrypt(sessionCookie);
  if (!session) return null;

  // Refresh the session if it's about to expire (e.g., in the last 15 minutes)
  const now = Date.now();
  const expires = session.exp * 1000;
  if (expires - now < 15 * 60 * 1000) {
    const newExpires = new Date(now + 60 * 60 * 1000); // 1 hour from now
    session.exp = Math.floor(newExpires.getTime() / 1000);
    const newSessionToken = await encrypt({ user: session.user, expires: newExpires });
    (await cookies()).set('session', newSessionToken, { expires: newExpires, httpOnly: true });
  }

  return session.user;
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const res = await encrypt(parsed);
    
    const cookieStore = cookies();
    (await cookieStore).set('session', res, {
        httpOnly: true,
        expires: parsed.expires,
    });
}
