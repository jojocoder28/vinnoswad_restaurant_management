
"use client";

import type { Order, MenuItem, OrderStatus, Waiter } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Bell, Utensils, Package, Clock, ShieldAlert, XCircle } from 'lucide-react';
import OrderCard from './order-card';
import MenuManagement from './menu-management';
import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import CancelOrderForm from './cancel-order-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


interface ManagerViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
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
  onCancelOrder,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: ManagerViewProps) {
  
  const [confirmation, setConfirmation] = useState<{ orderId: string, status: OrderStatus, message: string } | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  const preparedOrders = useMemo(() => orders.filter(o => o.status === 'prepared'), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === 'ready'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'cancelled'), [orders]);

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

  const handleConfirm = () => {
    if (confirmation) {
      onUpdateStatus(confirmation.orderId, confirmation.status);
      setConfirmation(null);
    }
  };

  const handleConfirmCancel = (reason: string) => {
    if (cancellingOrder) {
        onCancelOrder(cancellingOrder.id, reason);
        setCancellingOrder(null);
    }
  };

  const renderOrderActions = (order: Order) => {
    switch (order.status) {
        case 'pending':
            return (
                <div className='flex items-center gap-2 w-full'>
                    <Button
                      variant="outline"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-accent"
                      onClick={() => setConfirmation({ orderId: order.id, status: 'approved', message: `This will send the order for Table ${order.tableNumber} to the kitchen.` })}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className='h-9 w-9'>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setCancellingOrder(order)} className="text-destructive focus:text-destructive">
                                <XCircle className='mr-2' /> Cancel Order
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        case 'prepared':
            return (
                <Button className="w-full" onClick={() => setConfirmation({ orderId: order.id, status: 'ready', message: `This will notify ${getWaiterName(order.waiterId)} to pick up the order for Table ${order.tableNumber}.` })}>
                    <Bell className="mr-2 h-4 w-4" /> Notify Waiter
                </Button>
            );
        case 'approved':
             return (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className='w-full'>
                            In Kitchen...
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setCancellingOrder(order)} className="text-destructive focus:text-destructive">
                             <XCircle className='mr-2' /> Cancel Order
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             );
        case 'ready':
             return (
                <span className='text-sm text-muted-foreground'>Waiting for waiter...</span>
             );
        default:
            return null;
    }
  }


  return (
    <>
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:w-fit">
        <TabsTrigger value="orders">Manage Orders</TabsTrigger>
        <TabsTrigger value="menu">Manage Menu</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="mt-6 space-y-8">
        <div>
            <h3 className="text-xl font-headline font-semibold mb-4">Today's Live Stats</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
               <StatCard title="Items Ordered Today" value={dailyItemsOrdered} icon={Package} />
               <StatCard title="Items Served Today" value={dailyItemsServed} icon={Utensils} />
               <StatCard title="Orders Pending" value={pendingOrders.length} icon={Clock} />
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
                  actions={renderOrderActions(order)}
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
          <h3 className="text-xl font-headline font-semibold mb-4">Ready for Pickup</h3>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparedOrders.length > 0 ? (
              preparedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                  actions={renderOrderActions(order)}
                />
              ))
            ) : (
                <Card className="col-span-full border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>No Orders Ready</CardTitle>
                        <CardDescription>No orders are ready for pickup from the kitchen.</CardDescription>
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
                  actions={renderOrderActions(order)}
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
          <h3 className="text-xl font-headline font-semibold mb-4">Waiting for Service</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {readyOrders.length > 0 ? (
              readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  menuItems={menuItems}
                  waiterName={getWaiterName(order.waiterId)}
                  actions={renderOrderActions(order)}
                />
              ))
            ) : (
                <Card className="col-span-full border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>All Orders Picked Up</CardTitle>
                        <CardDescription>No orders are currently waiting to be served.</CardDescription>
                    </CardHeader>
                </Card>
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
       <TabsContent value="cancelled" className="mt-6">
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Cancelled Orders</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map(order => (
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
                        <CardTitle>No Cancelled Orders</CardTitle>
                        <CardDescription>There are no cancelled orders to display.</CardDescription>
                    </CardHeader>
                </Card>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>

     <AlertDialog open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    {confirmation?.message} This action cannot be easily undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmation(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {cancellingOrder && (
        <CancelOrderForm
            isOpen={!!cancellingOrder}
            onClose={() => setCancellingOrder(null)}
            onConfirm={handleConfirmCancel}
        />
    )}
    </>
  );
}
