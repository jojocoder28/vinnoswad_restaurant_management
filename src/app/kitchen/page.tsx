
"use client";

import { useState, useEffect } from 'react';
import type { Order, MenuItem, DecodedToken, Waiter } from '@/lib/types';
import {
  getOrders,
  updateOrderStatus,
  getMenuItems,
  getWaiters,
  cancelOrder,
} from '../actions';

import KitchenView from '@/components/kitchen-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@/lib/auth';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const { toast } = useToast();
  const router = useRouter();

   useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ordersData, menuItemsData, waitersData, session] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
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


  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      const ordersData = await getOrders();
      setOrders(ordersData);
      toast({
        title: "Order Updated",
        description: `Order has been marked as ${status}.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder(orderId, reason);
      const ordersData = await getOrders();
      setOrders(ordersData);
      toast({
        title: "Order Cancelled",
        description: `The order has been cancelled.`,
        variant: "destructive"
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to cancel order.",
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
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Kitchen Orders</h1>
         <KitchenView
            orders={orders}
            menuItems={menuItems}
            waiters={waiters}
            onUpdateStatus={handleUpdateOrderStatus}
            onCancelOrder={handleCancelOrder}
          />
    </DashboardLayout>
  );
}
