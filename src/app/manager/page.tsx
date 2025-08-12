
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, User } from '@/lib/types';
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
} from '../actions';

import ManagerView from '@/components/manager-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';

export default function ManagerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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
    if(parsedUser.role !== 'manager') {
        router.push('/');
        return;
    }
    setUser(parsedUser);


    async function fetchData() {
      try {
        setLoading(true);
        await seedDatabase();
        const [ordersData, menuItemsData] = await Promise.all([
          getOrders(),
          getMenuItems(),
        ]);
        setOrders(ordersData);
        setMenuItems(menuItemsData);
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

  if (loading || !user) {
    return (
        <DashboardLayout user={user}>
             <p className="text-xl">Loading dashboard data...</p>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Manager Dashboard</h1>
         <ManagerView
            orders={orders}
            menuItems={menuItems}
            onUpdateStatus={handleUpdateOrderStatus}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
    </DashboardLayout>
  );
}
