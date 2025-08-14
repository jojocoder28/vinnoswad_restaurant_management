
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Order, MenuItem, Waiter, DecodedToken, User, UserStatus, UserRole, Table, Supplier, StockItem, PurchaseOrder, StockUsageLog } from '@/lib/types';
import { 
    getOrders, getMenuItems, getWaiters, getUsers, updateUserStatus, deleteUser, registerUser, getTables, addMenuItem, updateMenuItem, deleteMenuItem,
    getSuppliers, addSupplier, updateSupplier, deleteSupplier,
    getStockItems, addStockItem, updateStockItem, deleteStockItem,
    getPurchaseOrders, addPurchaseOrder, updatePurchaseOrderStatus,
    getStockUsageLogs
} from '../actions';
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
  const [tables, setTables] = useState<Table[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockUsageLogs, setStockUsageLogs] = useState<StockUsageLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
            ordersData, menuItemsData, waitersData, usersData, tablesData, 
            suppliersData, stockItemsData, purchaseOrdersData, stockLogsData, session
        ] = await Promise.all([
          getOrders(),
          getMenuItems(),
          getWaiters(),
          getUsers(),
          getTables(),
          getSuppliers(),
          getStockItems(),
          getPurchaseOrders(),
          getStockUsageLogs(),
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
        setTables(tablesData);
        setSuppliers(suppliersData);
        setStockItems(stockItemsData);
        setPurchaseOrders(purchaseOrdersData);
        setStockUsageLogs(stockLogsData);

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
      const updatedMenuItems = await getMenuItems();
      setMenuItems(updatedMenuItems);
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

  // Supply Chain Handlers
  const handleAddSupplier = async (data: Omit<Supplier, 'id'>) => {
      await addSupplier(data);
      setSuppliers(await getSuppliers());
      toast({ title: "Supplier Added" });
  };
  const handleUpdateSupplier = async (data: Supplier) => {
      await updateSupplier(data);
      setSuppliers(await getSuppliers());
      toast({ title: "Supplier Updated" });
  };
  const handleDeleteSupplier = async (id: string) => {
      await deleteSupplier(id);
      setSuppliers(await getSuppliers());
      toast({ title: "Supplier Deleted", variant: "destructive" });
  };
  const handleAddStockItem = async (data: Omit<StockItem, 'id'>) => {
      await addStockItem(data);
      setStockItems(await getStockItems());
      toast({ title: "Stock Item Added" });
  };
  const handleUpdateStockItem = async (data: StockItem) => {
      await updateStockItem(data);
      setStockItems(await getStockItems());
      toast({ title: "Stock Item Updated" });
  };
  const handleDeleteStockItem = async (id: string) => {
      await deleteStockItem(id);
      setStockItems(await getStockItems());
      toast({ title: "Stock Item Deleted", variant: "destructive" });
  };
  const handleAddPurchaseOrder = async (data: Omit<PurchaseOrder, 'id'>) => {
      await addPurchaseOrder(data);
      setPurchaseOrders(await getPurchaseOrders());
      toast({ title: "Purchase Order Created" });
  };
  const handleReceivePurchaseOrder = async (id: string) => {
      await updatePurchaseOrderStatus(id, 'received');
      setPurchaseOrders(await getPurchaseOrders());
      setStockItems(await getStockItems()); // Stock levels have changed
      toast({ title: "Purchase Order Received", description: "Stock levels have been updated." });
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
            tables={tables}
            suppliers={suppliers}
            stockItems={stockItems}
            purchaseOrders={purchaseOrders}
            stockUsageLogs={stockUsageLogs}
            onUpdateUserStatus={handleUpdateUserStatus}
            onDeleteUser={handleDeleteUser}
            onCreateUser={handleCreateUser}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={onDeleteMenuItem}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddStockItem={handleAddStockItem}
            onUpdateStockItem={handleUpdateStockItem}
            onDeleteStockItem={handleDeleteStockItem}
            onAddPurchaseOrder={handleAddPurchaseOrder}
            onReceivePurchaseOrder={onReceivePurchaseOrder}
            currentUser={user}
        />
    </DashboardLayout>
  );
}
