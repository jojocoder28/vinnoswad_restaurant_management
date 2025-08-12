
"use client";

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';


// The middleware now handles all redirection logic.
// This component just shows a loading state while the middleware determines
// where to send the user.
export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We don't need to do anything here because the middleware will handle redirection.
    // We can just set loading to false after a moment.
    const timer = setTimeout(() => setLoading(false), 500); // Simulate a small delay
    return () => clearTimeout(timer);
  }, []);
  
  return (
      <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
      </div>
  )
}
