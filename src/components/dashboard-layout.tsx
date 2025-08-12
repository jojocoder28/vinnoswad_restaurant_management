
"use client";

import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Logo from './logo';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">EateryFlow</h1>
          </div>
          <div className='flex items-center gap-4'>
            {user && (
                <span className='text-muted-foreground hidden sm:inline'>
                    Welcome, {user.name}
                </span>
            )}
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        <main className="space-y-8">
            {children}
        </main>
      </div>
    </div>
  );
}
