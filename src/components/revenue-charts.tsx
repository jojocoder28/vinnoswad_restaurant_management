"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Order, MenuItem, Waiter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ChartConfig } from "@/components/ui/chart"

interface RevenueChartsProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function RevenueCharts({ orders, menuItems, waiters }: RevenueChartsProps) {
  const revenueByWaiter = useMemo(() => {
    const revenueMap = new Map<string, number>();
    orders.forEach(order => {
      const orderTotal = order.items.reduce((sum, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return sum + (menuItem ? menuItem.price * item.quantity : 0);
      }, 0);
      const currentRevenue = revenueMap.get(order.waiterId) || 0;
      revenueMap.set(order.waiterId, currentRevenue + orderTotal);
    });
    return waiters.map(waiter => ({
      name: waiter.name,
      revenue: revenueMap.get(waiter.id) || 0,
    }));
  }, [orders, menuItems, waiters]);

  const revenueByItem = useMemo(() => {
    const revenueMap = new Map<string, { revenue: number, quantity: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        if (menuItem) {
          const current = revenueMap.get(item.menuItemId) || { revenue: 0, quantity: 0 };
          revenueMap.set(item.menuItemId, {
            revenue: current.revenue + menuItem.price * item.quantity,
            quantity: current.quantity + item.quantity
          });
        }
      });
    });
    return Array.from(revenueMap.entries()).map(([id, data]) => ({
      name: menuItems.find(mi => mi.id === id)?.name || 'Unknown',
      revenue: data.revenue,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders, menuItems]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline'>Revenue by Waiter</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={revenueByWaiter}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(2)}`} />}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className='font-headline'>Top 10 Revenue by Menu Item</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={revenueByItem} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(2)}`} />}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}