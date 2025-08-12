
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { getUsers, seedDatabase } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Logo from '@/components/logo';

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function setup() {
      try {
        setLoading(true);
        await seedDatabase();
        const usersData = await getUsers();
        setUsers(usersData);
        if(usersData.length > 0) {
            setSelectedUserId(usersData[0].id)
        }
      } catch (e) {
        console.error(e);
        setError('Failed to connect to the database. Please check the connection string.');
      } finally {
        setLoading(false);
      }
    }
    setup();
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      // In a real app, you'd use a proper session management system.
      // For this demo, we'll use localStorage.
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      switch(user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'manager':
          router.push('/manager');
          break;
        case 'waiter':
          router.push('/waiter');
          break;
      }
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="flex items-center gap-4">
                <Logo className="animate-spin" />
                <p className="text-xl">Loading restaurant data...</p>
            </div>
        </div>
    )
  }

  if (error) {
     return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <Card className="w-full max-w-sm border-destructive">
                <CardHeader>
                    <CardTitle>Connection Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error}</p>
                     <p className="text-sm text-muted-foreground mt-4">Please make sure your MongoDB URI is correct in the `.env.local` file and that the database is accessible.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">EateryFlow</h1>
          </div>
      </header>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Login</CardTitle>
          <CardDescription>Select a user to view their dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleLogin} className="w-full" disabled={!selectedUserId}>
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
