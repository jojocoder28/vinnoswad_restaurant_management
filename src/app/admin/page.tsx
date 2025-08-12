
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, DecodedToken } from '@/lib/types';
import { getOrders, getMenuItems, getWaiters } from '../actions';
import AdminView from '@/components/admin-view';
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function AdminPage() {
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
          getSession()
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
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Admin Overview</h1>
        <AdminView orders={orders} menuItems={menuItems} waiters={waiters} />
    </DashboardLayout>
  );
}
