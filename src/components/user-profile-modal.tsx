
"use client";

import type { User, Order, MenuItem, Waiter } from '@/lib/types';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    orders: Order[];
    menuItems: MenuItem[];
    waiters: Waiter[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function UserProfileModal({ isOpen, onClose, user, orders, menuItems, waiters }: UserProfileModalProps) {
    
    const { performance, waiterProfile, recentOrders } = useMemo(() => {
        if (user.role !== 'waiter') {
            return { performance: null, waiterProfile: null, recentOrders: [] };
        }

        const waiterProfile = waiters.find(w => w.userId === user.id);
        if (!waiterProfile) {
            return { performance: null, waiterProfile: null, recentOrders: [] };
        }

        const waiterOrders = orders.filter(o => o.waiterId === waiterProfile.id);
        const totalOrders = waiterOrders.length;
        const totalRevenue = waiterOrders.reduce((total, order) => {
            const orderTotal = order.items.reduce((sum, item) => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                return sum + (menuItem ? menuItem.price * item.quantity : 0);
            }, 0);
            return total + orderTotal;
        }, 0);
        
        const sortedOrders = [...waiterOrders].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

        return { 
            performance: { totalOrders, totalRevenue },
            waiterProfile,
            recentOrders: sortedOrders
        };
    }, [user, orders, menuItems, waiters]);


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className='font-headline text-2xl'>Employee Profile: {user.name}</DialogTitle>
                    <DialogDescription>
                        Performance overview for <span className="font-semibold">{user.email}</span>.
                         <Badge variant="outline" className="ml-2 capitalize">{user.role}</Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {user.role === 'waiter' && performance && waiterProfile ? (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                                <StatCard title="Total Orders Taken" value={performance.totalOrders} icon={ClipboardList} />
                                <StatCard title="Total Revenue Generated" value={`₹${performance.totalRevenue.toFixed(2)}`} icon={IndianRupee} />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Recent Orders</h4>
                                <Card>
                                    <ScrollArea className="h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Table</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentOrders.map(order => {
                                                 const orderTotal = order.items.reduce((total, item) => {
                                                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                                    return total + (menuItem ? menuItem.price * item.quantity : 0);
                                                }, 0);
                                                return (
                                                    <TableRow key={order.id}>
                                                        <TableCell>{order.tableNumber}</TableCell>
                                                        <TableCell>{order.items.reduce((p,c) => p + c.quantity, 0)}</TableCell>
                                                        <TableCell><Badge variant="outline" className="capitalize">{order.status}</Badge></TableCell>
                                                        <TableCell className="text-right font-mono">₹{orderTotal.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                    </ScrollArea>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Performance data is only available for waiters.</p>
                    )}
                     {user.role !== 'waiter' && (
                        <Card className="p-6 text-center">
                            <CardTitle>No Performance Data</CardTitle>
                            <CardContent className="pt-4">
                                <p className="text-muted-foreground">Performance metrics are not tracked for the '{user.role}' role.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
