
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, User } from '@/lib/types';
import {
  getOrders,
  getMenuItems,
  getWaiters,
  seedDatabase,
} from '../actions';

import AdminView from '@/components/admin-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
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
    if(parsedUser.role !== 'admin') {
        router.push('/');
        return;
    }
    setUser(parsedUser);

    async function fetchData() {
      try {
        setLoading(true);
        await seedDatabase();
        const [ordersData, menuItemsData, waitersData] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
        ]);
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
             <p className="text-xl">Loading dashboard data...</p>
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
