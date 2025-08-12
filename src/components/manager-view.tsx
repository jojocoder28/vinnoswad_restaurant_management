"use client";

import type { Order, MenuItem, OrderStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat } from 'lucide-react';
import OrderCard from './order-card';
import MenuManagement from './menu-management';
import { useMemo } from 'react';

interface ManagerViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
}

export default function ManagerView({
  orders,
  menuItems,
  onUpdateStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: ManagerViewProps) {
  
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => o.status === 'approved' || o.status === 'ready'), [orders]);

  return (
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-fit">
        <TabsTrigger value="orders">Manage Orders</TabsTrigger>
        <TabsTrigger value="menu">Manage Menu</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="mt-6 space-y-6">
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Pending Approval</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName="Manager"
                  actions={
                    <Button
                      variant="outline"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-accent"
                      onClick={() => onUpdateStatus(order.id, 'approved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  }
                />
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No orders waiting for approval.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Active Orders</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName="Kitchen"
                  actions={
                    order.status === 'approved' ? (
                      <Button className="w-full" onClick={() => onUpdateStatus(order.id, 'ready')}>
                        <ChefHat className="mr-2 h-4 w-4" /> Mark as Ready
                      </Button>
                    ) : null
                  }
                />
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No active orders in the kitchen.</p>
            )}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="menu" className="mt-6">
        <MenuManagement
          menuItems={menuItems}
          onAddMenuItem={onAddMenuItem}
          onUpdateMenuItem={onUpdateMenuItem}
          onDeleteMenuItem={onDeleteMenuItem}
        />
      </TabsContent>
    </Tabs>
  );
}
