"use client";

import { useState, useMemo } from 'react';
import type { Order, MenuItem, Waiter } from '@/lib/types';
import { initialMenuItems, initialOrders, initialWaiters } from '@/lib/mock-data';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import WaiterView from '@/components/waiter-view';
import ManagerView from '@/components/manager-view';
import AdminView from '@/components/admin-view';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [waiters, setWaiters] = useState<Waiter[]>(initialWaiters);
  const { toast } = useToast();

  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const handleCreateOrder = (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: "Order Created",
      description: `New order for table ${newOrder.tableNumber} has been placed.`,
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
    toast({
      title: "Order Updated",
      description: `Order ${orderId} status changed to ${status}.`,
    });
  };

  const handleAddMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `ITEM-${Date.now()}`,
    };
    setMenuItems(prev => [...prev, newItem]);
    toast({
      title: "Menu Item Added",
      description: `${newItem.name} has been added to the menu.`,
    });
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
     toast({
      title: "Menu Item Updated",
      description: `${updatedItem.name} has been updated.`,
    });
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
     toast({
      title: "Menu Item Deleted",
      description: `An item has been removed from the menu.`,
      variant: 'destructive'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">EateryFlow</h1>
          </div>
        </header>

        <main>
          <Tabs defaultValue="waiter" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-fit">
              <TabsTrigger value="waiter">Waiter</TabsTrigger>
              <TabsTrigger value="manager" className="relative">
                Manager
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-primary-foreground text-xs items-center justify-center">{pendingOrdersCount}</span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="waiter">
              <Card>
                <CardHeader>
                  <CardTitle className='font-headline'>Waiter View</CardTitle>
                </CardHeader>
                <CardContent>
                  <WaiterView
                    orders={orders}
                    menuItems={menuItems}
                    waiters={waiters}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onCreateOrder={handleCreateOrder}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manager">
              <Card>
                <CardHeader>
                  <CardTitle className='font-headline'>Manager Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <ManagerView
                    orders={orders}
                    menuItems={menuItems}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onAddMenuItem={handleAddMenuItem}
                    onUpdateMenuItem={handleUpdateMenuItem}
                    onDeleteMenuItem={handleDeleteMenuItem}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle className='font-headline'>Admin Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminView orders={orders} menuItems={menuItems} waiters={waiters} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
