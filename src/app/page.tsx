
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, Table } from '@/lib/types';
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getWaiters,
  seedDatabase,
  getTables
} from './actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import WaiterView from '@/components/waiter-view';
import ManagerView from '@/components/manager-view';
import AdminView from '@/components/admin-view';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        await seedDatabase(); // Seeds database with mock data if it's empty
        const [ordersData, menuItemsData, waitersData, tablesData] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
          getTables(),
        ]);
        setOrders(ordersData);
        setMenuItems(menuItemsData);
        setWaiters(waitersData);
        setTables(tablesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Could not load data from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const handleCreateOrder = async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>, tableId: string) => {
    try {
      const newOrder = await createOrder(orderData, tableId);
      setOrders(prev => [newOrder, ...prev]);
      const table = tables.find(t => t.id === tableId);
      if (table) {
        setTables(prev => prev.map(t => t.id === tableId ? {...t, status: 'occupied'} : t));
      }
      toast({
        title: "Order Created",
        description: `New order for table ${newOrder.tableNumber} has been placed.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to create order.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      toast({
        title: "Order Updated",
        description: `Order ${orderId} status changed to ${status}.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const handleAddMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    try {
      const newItem = await addMenuItem(itemData);
      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: "Menu Item Added",
        description: `${newItem.name} has been added to the menu.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add menu item.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMenuItem = async (updatedItem: MenuItem) => {
    try {
      await updateMenuItem(updatedItem);
      setMenuItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
       toast({
        title: "Menu Item Updated",
        description: `${updatedItem.name} has been updated.`,
      });
    } catch(error) {
        toast({
        title: "Error",
        description: "Failed to update menu item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
       toast({
        title: "Menu Item Deleted",
        description: `An item has been removed from the menu.`,
        variant: 'destructive'
      });
    } catch (error) {
        toast({
        title: "Error",
        description: "Failed to delete menu item.",
        variant: "destructive",
      });
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
                    tables={tables}
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
