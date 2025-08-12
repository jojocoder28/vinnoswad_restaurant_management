"use client";

import type { Order, MenuItem, Waiter } from '@/lib/types';
import StatsCards from './stats-cards';
import RevenueCharts from './revenue-charts';
import { useMemo } from 'react';

interface AdminViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
}

export default function AdminView({ orders, menuItems, waiters }: AdminViewProps) {
  const servedOrders = useMemo(() => orders.filter(o => o.status === 'served'), [orders]);

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
    <div className="space-y-8">
      <StatsCards 
        totalRevenue={totalRevenue} 
        totalOrders={totalOrders} 
        servedOrders={servedOrders.length}
        totalMenuItems={totalMenuItems}
      />
      <RevenueCharts orders={servedOrders} menuItems={menuItems} waiters={waiters} />
    </div>
  );
}
