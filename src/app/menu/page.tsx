
import { getMenuItems } from '../actions';
import type { MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Utensils, Soup, Fish, Beef, Vegan, Cookie } from 'lucide-react';

const AnimatedBackground = () => (
    <div className="area">
        <ul className="circles">
            <li><Utensils/></li>
            <li><Soup/></li>
            <li><Fish/></li>
            <li><Beef/></li>
            <li><Vegan/></li>
            <li><Cookie/></li>
            <li><Fish/></li>
            <li><Utensils/></li>
            <li><Soup/></li>
            <li><Cookie/></li>
        </ul>
    </div >
)

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
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <AnimatedBackground />
             <header className="py-6 px-4 md:px-8 bg-card/80 backdrop-blur-sm border-b sticky top-0 z-20">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Logo />
                         <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Vinnoswad</h1>
                    </div>
                     <Button asChild variant="outline" className="hidden md:inline-flex">
                        <Link href="/login">Staff Login</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">Our Menu</h2>
                    <p className="text-muted-foreground mt-2 text-lg">A taste of tradition, crafted with passion.</p>
                </div>

                <div className="space-y-12">
                    {Object.entries(groupedMenu).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-3xl font-headline font-semibold mb-2">{category}</h3>
                            <Separator className="mb-8"/>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                                {items.map(item => (
                                    <Card key={item.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm">
                                        <CardHeader className="p-0">
                                            <div className="aspect-[4/3] overflow-hidden">
                                                <Image 
                                                    src={item.imageUrl || 'https://placehold.co/400x300.png'} 
                                                    alt={item.name} 
                                                    width={400} 
                                                    height={300} 
                                                    className="object-cover w-full h-full"
                                                    data-ai-hint={`${item.category} ${item.name}`}
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 md:p-6 flex-grow flex flex-col">
                                             <CardTitle className="text-base md:text-2xl font-headline text-primary">{item.name}</CardTitle>
                                             <div className="flex-grow" />
                                             <p className="font-mono text-primary font-bold text-sm md:text-xl mt-2 md:mt-4">₹{item.price.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                     {availableMenuItems.length === 0 && (
                        <Card className="col-span-full border-dashed py-20 bg-card/90 backdrop-blur-sm">
                            <CardHeader className="text-center">
                                <CardTitle>Menu Not Available</CardTitle>
                                <CardDescription>Please check back later or contact the restaurant for today's offerings.</CardDescription>
                            </CardHeader>
                        </Card>
                     )}
                </div>
            </main>
             <footer className="mt-16 py-8 bg-card/80 backdrop-blur-sm border-t relative z-10">
                <div className="container mx-auto text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Vinnoswad Restaurant. All Rights Reserved.</p>
                     <p className="text-xs mt-2 md:hidden">
                        <Link href="/login" className="hover:text-primary underline">Staff Login</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}
