
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // This component will just handle redirection
    router.push('/login');
  }, [router]);

  return null; // Return null or a loading spinner while redirecting
}
