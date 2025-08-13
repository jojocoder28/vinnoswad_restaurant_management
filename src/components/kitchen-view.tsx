
"use client";

import type { Order, MenuItem, OrderStatus, Waiter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChefHat, ShieldAlert, XCircle } from 'lucide-react';
import OrderCard from './order-card';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import CancelOrderForm from './cancel-order-form';


interface KitchenViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
}

export default function KitchenView({
  orders,
  menuItems,
  waiters,
  onUpdateStatus,
  onCancelOrder
}: KitchenViewProps) {

  const [confirmation, setConfirmation] = useState<{ orderId: string, status: OrderStatus, message: string } | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  
  const getWaiterName = (waiterId: string) => {
    return waiters.find(w => w.id === waiterId)?.name || 'Unknown';
  }

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
  }

  return (
    <>
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
                    <div className='w-full flex flex-col gap-2'>
                        <Button
                            className="w-full"
                            onClick={() => setConfirmation({ orderId: order.id, status: 'prepared', message: `This will mark the order for Table ${order.tableNumber} as prepared and ready for pickup.` })}
                        >
                            <ChefHat className="mr-2 h-4 w-4" /> Mark as Prepared
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setCancellingOrder(order)}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                        </Button>
                    </div>
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
