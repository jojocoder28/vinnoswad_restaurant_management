
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, ClipboardList, Utensils, CheckSquare, XCircle } from 'lucide-react';

interface StatsCardsProps {
  totalRevenue: number;
  totalOrders: number;
  servedOrders: number;
  cancelledOrders: number;
  totalMenuItems: number;
}

export default function StatsCards({ totalRevenue, totalOrders, servedOrders, cancelledOrders, totalMenuItems }: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: IndianRupee,
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: ClipboardList,
    },
    {
      title: 'Orders Served',
      value: servedOrders,
      icon: CheckSquare,
    },
     {
      title: 'Orders Cancelled',
      value: cancelledOrders,
      icon: XCircle,
      className: "text-destructive"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.className || ''}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
