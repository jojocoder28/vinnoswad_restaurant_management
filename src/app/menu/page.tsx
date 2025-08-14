
import { getMenuItems } from '../actions';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function MenuPage() {
    const allMenuItems = await getMenuItems();
    const availableMenuItems = allMenuItems.filter(item => item.isAvailable);

    const groupedMenu = availableMenuItems.reduce((acc, item) => {
        const { category } = item;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    return (
        <div className="min-h-screen bg-background text-foreground">
             <header className="py-6 px-4 md:px-8 bg-card border-b">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Logo />
                         <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Vinnoswad</h1>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/login">Staff Login</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">Our Menu</h2>
                    <p className="text-muted-foreground mt-2 text-lg">A taste of tradition, crafted with passion.</p>
                </div>

                <div className="space-y-12">
                    {Object.entries(groupedMenu).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-3xl font-headline font-semibold mb-2">{category}</h3>
                            <Separator className="mb-8"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {items.map(item => (
                                    <Card key={item.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                                        <CardHeader className="p-0">
                                            <Image 
                                                src={item.imageUrl || 'https://placehold.co/400x300.png'} 
                                                alt={item.name} 
                                                width={400} 
                                                height={300} 
                                                className="object-cover aspect-[4/3]"
                                                data-ai-hint={`${item.category} ${item.name}`}
                                            />
                                        </CardHeader>
                                        <CardContent className="p-6 flex-grow flex flex-col">
                                             <CardTitle className="text-2xl font-headline text-primary">{item.name}</CardTitle>
                                             <div className="flex-grow" />
                                             <p className="font-mono text-primary font-bold text-xl mt-4">₹{item.price.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                     {availableMenuItems.length === 0 && (
                        <Card className="col-span-full border-dashed py-20">
                            <CardHeader className="text-center">
                                <CardTitle>Menu Not Available</CardTitle>
                                <CardDescription>Please check back later or contact the restaurant for today's offerings.</CardDescription>
                            </CardHeader>
                        </Card>
                     )}
                </div>
            </main>
             <footer className="mt-16 py-8 bg-card border-t">
                <div className="container mx-auto text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Vinnoswad Restaurant. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}
