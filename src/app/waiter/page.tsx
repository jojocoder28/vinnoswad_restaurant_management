
"use client";

import { useState, useEffect } from 'react';
import type { Order, MenuItem, Waiter, Table, DecodedToken } from '@/lib/types';
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  getMenuItems,
  getWaiters,
  getTables
} from '../actions';

import WaiterView from '@/components/waiter-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@/lib/auth';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function WaiterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ordersData, menuItemsData, waitersData, tablesData, session] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
          getTables(),
          getSession(),
        ]);
        
        if (!session) {
            router.push('/login');
            return;
        }
        setUser(session);

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
             <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
             </div>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Waiter Dashboard</h1>
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
