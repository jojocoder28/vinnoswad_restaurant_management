
"use client";

import type { Order, MenuItem, OrderStatus, Waiter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChefHat } from 'lucide-react';
import OrderCard from './order-card';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface KitchenViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export default function KitchenView({
  orders,
  menuItems,
  waiters,
  onUpdateStatus,
}: KitchenViewProps) {
  
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  
  const getWaiterName = (waiterId: string) => {
    return waiters.find(w => w.id === waiterId)?.name || 'Unknown';
  }

  return (
    <div className="w-full mt-6 space-y-6">
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">New Orders</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {approvedOrders.length > 0 ? (
              approvedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                  actions={
                    <Button
                      className="w-full"
                      onClick={() => onUpdateStatus(order.id, 'prepared')}
                    >
                      <ChefHat className="mr-2 h-4 w-4" /> Mark as Prepared
                    </Button>
                  }
                />
              ))
            ) : (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No Orders in the Kitchen</CardTitle>
                            <CardDescription>
                            There are currently no orders waiting to be prepared.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )}
          </div>
        </div>
    </div>
  );
}
