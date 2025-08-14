
"use client"

import type { Table, Waiter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Utensils, User } from 'lucide-react';

interface TableStatusGridProps {
    tables: Table[];
    waiters: Waiter[];
}

export default function TableStatusGrid({ tables, waiters }: TableStatusGridProps) {
    const getWaiterName = (waiterId: string | null | undefined) => {
        if (!waiterId) return 'N/A';
        return waiters.find(w => w.id === waiterId)?.name || 'Unknown';
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {tables.map(table => (
                <Card 
                    key={table.id}
                    className={cn(
                        "transition-all",
                        table.status === 'occupied' ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/5 border-primary/20'
                    )}
                >
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="flex items-center gap-2 font-headline text-lg">
                            <Utensils className="w-5 h-5"/>
                            Table {table.tableNumber}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm">
                        <p className={cn(
                            "font-semibold capitalize",
                             table.status === 'occupied' ? 'text-destructive' : 'text-primary'
                        )}>
                            {table.status}
                        </p>
                        {table.status === 'occupied' && (
                            <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                <User className="w-3 h-3"/>
                                <span>{getWaiterName(table.waiterId)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
