
"use client";

import { useState, useEffect } from 'react';
import type { Order, MenuItem, DecodedToken, Waiter, Bill, Table, OrderItem } from '@/lib/types';
import {
  getOrders,
  updateOrderStatus,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getWaiters,
  cancelOrder,
  getBills,
  createBillForTable,
  markBillAsPaid,
  getTables
} from '../actions';

import ManagerView from '@/components/manager-view';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@/lib/auth';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ManagerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
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
        const [ordersData, menuItemsData, waitersData, billsData, tablesData, session] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
          getBills(),
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
        setBills(billsData);
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
  }

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

  const handleCreateBill = async (tableNumber: number): Promise<Bill | void> => {
    try {
        const newBill = await createBillForTable(tableNumber);
        setBills(prev => [newBill, ...prev]);
        const updatedOrders = await getOrders();
        setOrders(updatedOrders);
        toast({
            title: "Bill Generated",
            description: `Bill for table ${tableNumber} has been created.`
        });
        return newBill;
    } catch (error) {
         toast({
            title: "Error Generating Bill",
            description: "Could not create bill. Ensure there are served orders.",
            variant: "destructive"
        });
    }
  }

  const handlePayBill = async (billId: string) => {
    try {
        await markBillAsPaid(billId);
        const [updatedBills, updatedTables] = await Promise.all([getBills(), getTables()]);
        setBills(updatedBills);
        setTables(updatedTables);
        toast({
            title: "Payment Recorded",
            description: "Bill has been marked as paid and table is now available.",
        });
    } catch (error) {
         toast({
            title: "Error",
            description: "Failed to mark bill as paid.",
            variant: "destructive"
        });
    }
  }

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
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Manager Dashboard</h1>
         <ManagerView
            orders={orders}
            bills={bills}
            menuItems={menuItems}
            waiters={waiters}
            tables={tables}
            onUpdateStatus={handleUpdateOrderStatus}
            onCancelOrder={handleCancelOrder}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onCreateBill={handleCreateBill}
            onPayBill={handlePayBill}
            currentUser={user}
          />
    </DashboardLayout>
  );
}

    