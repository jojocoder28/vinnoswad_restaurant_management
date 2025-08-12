
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser, seedDatabase } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
        await seedDatabase();
        const result = await loginUser(values.email, values.password);
        if (result.success && result.user) {
            toast({
                title: "Login Successful",
                description: `Welcome back, ${result.user.name}!`,
            });
            // The middleware now handles all redirection logic.
            // We'll force a reload of the current page which will trigger the middleware.
            router.refresh();
        } else {
            toast({
                title: "Login Failed",
                description: result.error || "Please check your credentials.",
                variant: "destructive",
            });
        }
    } catch (e) {
      console.error(e);
      toast({
        title: 'An Error Occurred',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="mb-8 flex flex-col items-center text-center gap-4">
        <Logo />
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">EateryFlow</h1>
        <p className="text-muted-foreground">Streamlined order management for restaurants.</p>
      </header>

      <Alert className="max-w-sm mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Demo Accounts</AlertTitle>
          <AlertDescription>
           <div className="text-xs">Use <span className="font-semibold">admin@eatery.com</span>, <span className="font-semibold">manager@eatery.com</span>, or <span className="font-semibold">arjun@eatery.com</span> with password <span className="font-mono text-primary bg-primary/10 px-1 rounded">123456</span> to log in.</div>
          </AlertDescription>
      </Alert>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </Form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="underline hover:text-primary">
                    Sign up
                </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
