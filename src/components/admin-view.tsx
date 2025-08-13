
"use client";

import type { Order, MenuItem, Waiter, User, UserStatus, DecodedToken, Table } from '@/lib/types';
import StatsCards from './stats-cards';
import RevenueCharts from './revenue-charts';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './user-management';
import LiveStatusDashboard from './live-status-dashboard';
import ServedOrdersList from './served-orders-list';
import CancelledOrdersList from './cancelled-orders-list';
import ReportGenerator from './report-generator';

interface AdminViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  users: User[];
  tables: Table[];
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
    tables,
    onUpdateUserStatus, 
    onDeleteUser,
    onCreateUser, 
    currentUser 
}: AdminViewProps) {
  const servedOrders = useMemo(() => orders.filter(o => o.status === 'served' || o.status === 'billed'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'cancelled'), [orders]);

  const totalRevenue = useMemo(() => {
    return servedOrders.reduce((total, order) => {
      const orderTotal = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      return total + orderTotal;
    }, 0);
  }, [servedOrders]);

  const totalOrders = useMemo(() => orders.length, [orders]);
  const totalMenuItems = useMemo(() => menuItems.length, [menuItems]);

  return (
    <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="status">Restaurant Status</TabsTrigger>
            <TabsTrigger value="history">Order History</TabsTrigger>
            <TabsTrigger value="users">Staff & Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
        
        <TabsContent value="status" className="mt-6">
            <LiveStatusDashboard
                orders={orders}
                menuItems={menuItems}
                waiters={waiters}
                tables={tables}
            />
        </TabsContent>

         <TabsContent value="history" className="mt-6 space-y-8">
            <ServedOrdersList 
                orders={servedOrders}
                waiters={waiters}
            />
            <CancelledOrdersList
                orders={cancelledOrders}
                waiters={waiters}
            />
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

        <TabsContent value="reports" className="mt-6">
            <ReportGenerator />
        </TabsContent>
    </Tabs>
  );
}
