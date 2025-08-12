
"use client";

import type { Order, MenuItem, OrderStatus, Waiter } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Bell, Utensils, Package } from 'lucide-react';
import OrderCard from './order-card';
import MenuManagement from './menu-management';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface ManagerViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
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
  waiters,
  onUpdateStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: ManagerViewProps) {
  
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  const preparedOrders = useMemo(() => orders.filter(o => o.status === 'prepared'), [orders]);

  const getWaiterName = (waiterId: string) => waiters.find(w => w.id === waiterId)?.name || "Unknown";
  
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
      <TabsContent value="orders" className="mt-6 space-y-8">
        <div>
            <h3 className="text-xl font-headline font-semibold mb-4">Today's Live Stats</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
               <StatCard title="Items Ordered Today" value={dailyItemsOrdered} icon={Package} />
               <StatCard title="Items Served Today" value={dailyItemsServed} icon={Utensils} />
               <StatCard title="Orders Pending" value={pendingOrders.length} icon={CheckCircle} />
               <StatCard title="Orders in Kitchen" value={approvedOrders.length} icon={ChefHat} />
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
                  waiterName={getWaiterName(order.waiterId)}
                  actions={
                    <Button
                      variant="outline"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-accent"
                      onClick={() => onUpdateStatus(order.id, 'approved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve for Kitchen
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
          <h3 className="text-xl font-headline font-semibold mb-4">Ready for Pickup</h3>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparedOrders.length > 0 ? (
              preparedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                  actions={
                     <Button className="w-full" onClick={() => onUpdateStatus(order.id, 'ready')}>
                        <Bell className="mr-2 h-4 w-4" /> Notify Waiter
                      </Button>
                  }
                />
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No orders are ready for pickup from the kitchen.</p>
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
                <p className="col-span-full text-muted-foreground">No orders are currently in the kitchen.</p>
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
