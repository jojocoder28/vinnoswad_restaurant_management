
"use client";

import type { Order, MenuItem, Waiter, User, UserStatus, DecodedToken } from '@/lib/types';
import StatsCards from './stats-cards';
import RevenueCharts from './revenue-charts';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './user-management';

interface AdminViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  users: User[];
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (userData: Omit<User, 'id' | 'status'>) => void;
  currentUser: DecodedToken;
}

export default function AdminView({ 
    orders, 
    menuItems, 
    waiters, 
    users, 
    onUpdateUserStatus, 
    onDeleteUser,
    onCreateUser, 
    currentUser 
}: AdminViewProps) {
  const servedOrders = useMemo(() => orders.filter(o => o.status === 'served'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'cancelled'), [orders]);

  const totalRevenue = useMemo(() => {
    return servedOrders.reduce((total, order) => {
      const orderTotal = order.items.reduce((sum, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return sum + (menuItem ? menuItem.price * item.quantity : 0);
      }, 0);
      return total + orderTotal;
    }, 0);
  }, [servedOrders, menuItems]);

  const totalOrders = useMemo(() => orders.length, [orders]);
  const totalMenuItems = useMemo(() => menuItems.length, [menuItems]);

  return (
    <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-8">
            <StatsCards 
                totalRevenue={totalRevenue} 
                totalOrders={totalOrders} 
                servedOrders={servedOrders.length}
                cancelledOrders={cancelledOrders.length}
                totalMenuItems={totalMenuItems}
            />
            <RevenueCharts orders={servedOrders} menuItems={menuItems} waiters={waiters} />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
            <UserManagement 
                users={users}
                orders={orders}
                menuItems={menuItems}
                waiters={waiters}
                onUpdateUserStatus={onUpdateUserStatus}
                onDeleteUser={onDeleteUser}
                onCreateUser={onCreateUser}
                currentUser={currentUser}
             />
        </TabsContent>
    </Tabs>
  );
}
