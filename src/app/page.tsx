
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@/lib/auth';
import type { DecodedToken } from '@/lib/types';
import { useState } from 'react';

// This is a temporary homepage that will redirect based on role.
// You can replace this with a proper landing page if you wish.
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
        const session = await getSession();
        if (session) {
            setUser(session);
            router.push(`/${session.role}`);
        } else {
            router.push('/login');
        }
        setLoading(false);
    }
    checkSession();
  }, [router]);
  
  if(loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  return null;
}
