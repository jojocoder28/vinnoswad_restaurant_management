
"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/logo";
import { TriangleAlert } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
             <header className="mb-4 flex flex-col items-center text-center gap-4">
                <Logo />
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Vinnoswad</h1>
            </header>
            <Card className="w-full max-w-md text-center border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 font-headline text-2xl"><TriangleAlert className="w-6 h-6 text-destructive"/> Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>The page you are trying to access requires different privileges. Please log in with an authorized account.</p>
                    <Button asChild className="mt-6">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
