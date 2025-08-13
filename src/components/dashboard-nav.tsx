
"use client";

import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu } from 'lucide-react';

interface NavItem {
    value: string;
    label: string;
    content: React.ReactNode;
}

interface DashboardNavProps {
    items: NavItem[];
}

export default function DashboardNav({ items }: DashboardNavProps) {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState(items[0].value);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (isMobile) {
        const activeItem = items.find(item => item.value === activeTab);

        return (
            <div>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline">
                            <Menu className="mr-2 h-4 w-4" />
                            {activeItem?.label}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col space-y-2 mt-4">
                            {items.map(item => (
                                <Button
                                    key={item.value}
                                    variant={activeTab === item.value ? 'secondary' : 'ghost'}
                                    onClick={() => {
                                        setActiveTab(item.value);
                                        setIsSheetOpen(false);
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>

                <div className="mt-6">
                    {activeItem?.content}
                </div>
            </div>
        );
    }

    return (
        <Tabs defaultValue={items[0].value} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-8">
                {items.map(item => (
                    <TabsTrigger key={item.value} value={item.value} className="w-full">
                        {item.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {items.map(item => (
                <TabsContent key={item.value} value={item.value} className="mt-6">
                    {item.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
