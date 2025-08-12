"use client";

import type { Order, MenuItem, OrderStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Package, UtensilsCrossed } from 'lucide-react';
import OrderCard from './order-card';
import MenuManagement from './menu-management';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ManagerViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

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
  
  const { dailyItemsOrdered, dailyItemsServed } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let dailyItemsOrdered = 0;
    let dailyItemsServed = 0;

    orders.forEach(order => {
      const orderDate = order.timestamp.split('T')[0];
      if (orderDate === today) {
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        dailyItemsOrdered += itemCount;
        if (order.status === 'served') {
          dailyItemsServed += itemCount;
        }
      }
    });

    return { dailyItemsOrdered, dailyItemsServed };
  }, [orders]);


  return (
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-fit">
        <TabsTrigger value="orders">Manage Orders</TabsTrigger>
        <TabsTrigger value="menu">Manage Menu</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="mt-6 space-y-6">
        <div>
            <h3 className="text-xl font-headline font-semibold mb-4">Today's Live Stats</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
               <StatCard title="Items Ordered Today" value={dailyItemsOrdered} icon={Package} />
               <StatCard title="Items Served Today" value={dailyItemsServed} icon={UtensilsCrossed} />
            </div>
        </div>

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
