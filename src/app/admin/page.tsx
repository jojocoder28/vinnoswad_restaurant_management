
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, DecodedToken, User, UserStatus, UserRole } from '@/lib/types';
import { getOrders, getMenuItems, getWaiters, getUsers, updateUserStatus, deleteUser, registerUser } from '../actions';
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ordersData, menuItemsData, waitersData, usersData, session] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
          getUsers(),
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
        setUsers(usersData);
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

  const handleCreateUser = async (userData: Omit<User, 'id' | 'status'>) => {
    try {
      const result = await registerUser(userData, true); // `isAdminCreating` is true
      if (result.success) {
        toast({
          title: "User Created",
          description: `Account for ${userData.name} has been created.`,
        });
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive",
      });
    }
  };


  const handleUpdateUserStatus = async (userId: string, status: UserStatus) => {
    try {
      await updateUserStatus(userId, status);
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      toast({
        title: "User Status Updated",
        description: `User has been ${status}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
       toast({
        title: "User Deleted",
        description: `User account has been deleted.`,
        variant: 'destructive'
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive"
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
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Admin Overview</h1>
        <AdminView 
            orders={orders} 
            menuItems={menuItems} 
            waiters={waiters} 
            users={users}
            onUpdateUserStatus={handleUpdateUserStatus}
            onDeleteUser={handleDeleteUser}
            onCreateUser={handleCreateUser}
            currentUser={user}
        />
    </DashboardLayout>
  );
}
