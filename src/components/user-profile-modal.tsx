
"use client";

import type { User, Order, MenuItem, Waiter } from '@/lib/types';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, ClipboardList, ChefHat, Clock, Utensils } from 'lucide-react';
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
    
    const { waiterPerformance, waiterProfile, waiterRecentOrders } = useMemo(() => {
        if (user.role !== 'waiter') return { waiterPerformance: null, waiterProfile: null, waiterRecentOrders: [] };

        const waiterProfile = waiters.find(w => w.userId === user.id);
        if (!waiterProfile) return { waiterPerformance: null, waiterProfile: null, waiterRecentOrders: [] };

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
            waiterPerformance: { totalOrders, totalRevenue },
            waiterProfile,
            waiterRecentOrders: sortedOrders
        };
    }, [user, orders, menuItems, waiters]);

    const { managerPerformance, managerRecentPending } = useMemo(() => {
        if (user.role !== 'manager') return { managerPerformance: null, managerRecentPending: [] };
        
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const activeKitchenOrders = orders.filter(o => o.status === 'approved' || o.status === 'prepared');
        
        const recentPending = pendingOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

        return {
            managerPerformance: {
                pendingApproval: pendingOrders.length,
                activeInKitchen: activeKitchenOrders.length
            },
            managerRecentPending: recentPending
        };

    }, [user, orders]);
    
    const kitchenPerformance = useMemo(() => {
        if(user.role !== 'kitchen') return null;
        const preparedOrders = orders.filter(o => o.status === 'prepared' || o.status === 'ready' || o.status === 'served');
        const totalItemsPrepared = preparedOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        
        return {
            ordersPrepared: preparedOrders.length,
            itemsPrepared: totalItemsPrepared
        }
    }, [user, orders]);


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <DialogTitle className='font-headline text-2xl'>Employee Profile: {user.name}</DialogTitle>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </div>
                    <DialogDescription>
                        Performance overview for <span className="font-semibold">{user.email}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {user.role === 'waiter' && waiterPerformance && waiterProfile ? (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                                <StatCard title="Total Orders Taken" value={waiterPerformance.totalOrders} icon={ClipboardList} />
                                <StatCard title="Total Revenue Generated" value={`₹${waiterPerformance.totalRevenue.toFixed(2)}`} icon={IndianRupee} />
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
                                            {waiterRecentOrders.map(order => {
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
                    ) : user.role === 'manager' && managerPerformance ? (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                                <StatCard title="Pending Approvals" value={managerPerformance.pendingApproval} icon={Clock} />
                                <StatCard title="Active in Kitchen" value={managerPerformance.activeInKitchen} icon={ChefHat} />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Recent Pending Orders</h4>
                                <Card>
                                    <ScrollArea className="h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Table</TableHead>
                                                <TableHead>Waiter</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {managerRecentPending.length > 0 ? managerRecentPending.map(order => {
                                                 const orderTotal = order.items.reduce((total, item) => {
                                                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                                    return total + (menuItem ? menuItem.price * item.quantity : 0);
                                                }, 0);
                                                const waiter = waiters.find(w => w.id === order.waiterId);
                                                return (
                                                    <TableRow key={order.id}>
                                                        <TableCell>{order.tableNumber}</TableCell>
                                                        <TableCell>{waiter?.name || 'N/A'}</TableCell>
                                                        <TableCell>{order.items.reduce((p,c) => p + c.quantity, 0)}</TableCell>
                                                        <TableCell className="text-right font-mono">₹{orderTotal.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )
                                            }) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No pending orders.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    </ScrollArea>
                                </Card>
                            </div>
                        </>
                    ) : user.role === 'kitchen' && kitchenPerformance ? (
                         <div className="grid grid-cols-2 gap-4">
                            <StatCard title="Total Orders Prepared" value={kitchenPerformance.ordersPrepared} icon={ClipboardList} />
                            <StatCard title="Total Items Prepared" value={kitchenPerformance.itemsPrepared} icon={Utensils} />
                        </div>
                    ) : (
                        <Card className="p-6 text-center">
                            <CardTitle>No Performance Data</CardTitle>
                            <CardContent className="pt-4">
                                <p className="text-muted-foreground">Performance metrics are not tracked for this role, or there is no data yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
