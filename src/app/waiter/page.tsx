
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, Table, User } from '@/lib/types';
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  getMenuItems,
  getWaiters,
  seedDatabase,
  getTables
} from '../actions';

import WaiterView from '@/components/waiter-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';

export default function WaiterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        router.push('/');
        return;
    }
    const parsedUser = JSON.parse(loggedInUser);
    if(parsedUser.role !== 'waiter') {
        router.push('/');
        return;
    }
    setUser(parsedUser);


    async function fetchData() {
      try {
        setLoading(true);
        await seedDatabase();
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
  }, [toast, router]);

  const handleCreateOrder = async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>, tableId: string) => {
    try {
      const newOrder = await createOrder(orderData, tableId);
      setOrders(prev => [newOrder, ...prev]);
      setTables(prev => prev.map(t => t.id === tableId ? {...t, status: 'occupied'} : t));
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
      const [ordersData, tablesData] = await Promise.all([getOrders(), getTables()]);
      setOrders(ordersData);
      setTables(tablesData);
      toast({
        title: "Order Updated",
        description: `Order status has been changed to ${status}.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return (
        <DashboardLayout user={user}>
             <p className="text-xl">Loading dashboard data...</p>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Waiter View</h1>
        <WaiterView
            orders={orders}
            menuItems={menuItems}
            waiters={waiters}
            tables={tables}
            onUpdateStatus={handleUpdateOrderStatus}
            onCreateOrder={handleCreateOrder}
            currentUser={user}
            />
    </DashboardLayout>
  );
}
