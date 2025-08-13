
"use client";

import type { Order, MenuItem, Waiter, Table } from '@/lib/types';
import { useMemo } from 'react';
import OrderCard from './order-card';
import TableStatusGrid from './table-status-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LiveStatusDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  tables: Table[];
}

export default function LiveStatusDashboard({ orders, menuItems, waiters, tables }: LiveStatusDashboardProps) {
  
  const getWaiterName = (waiterId: string) => waiters.find(w => w.id === waiterId)?.name || "Unknown";

  const { pendingOrders, approvedOrders, preparedOrders } = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const approved = orders.filter(o => o.status === 'approved');
    const prepared = orders.filter(o => o.status === 'prepared');
    return { pendingOrders: pending, approvedOrders: approved, preparedOrders: prepared };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-headline font-semibold mb-4">Live Table Status</h3>
        <TableStatusGrid tables={tables} waiters={waiters} />
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Pending Approval</h3>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                />
              ))
            ) : (
                <Card className="col-span-full border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>No Pending Orders</CardTitle>
                        <CardDescription>There are no orders waiting for approval.</CardDescription>
                    </CardHeader>
                </Card>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">In the Kitchen</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {approvedOrders.length > 0 ? (
              approvedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                />
              ))
            ) : (
                <Card className="col-span-full border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>Kitchen is Clear</CardTitle>
                        <CardDescription>No orders are currently in the kitchen.</CardDescription>
                    </CardHeader>
                </Card>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Ready to Serve</h3>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparedOrders.length > 0 ? (
              preparedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                />
              ))
            ) : (
                <Card className="col-span-full border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>No Orders Ready</CardTitle>
                        <CardDescription>No orders are currently waiting to be served.</CardDescription>
                    </CardHeader>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
