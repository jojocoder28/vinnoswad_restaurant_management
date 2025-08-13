
"use client";

import React, { useMemo, useState } from 'react';
import type { Order, MenuItem, Waiter, OrderStatus, Table, DecodedToken, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, ShieldAlert } from 'lucide-react';
import OrderCard from './order-card';
import OrderForm from './order-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';


interface WaiterViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'items'> & { items: Omit<OrderItem, 'price'>[] }, tableId: string) => void;
  currentUser: DecodedToken;
}

export default function WaiterView({ orders, menuItems, waiters, tables, onUpdateStatus, onCreateOrder, currentUser }: WaiterViewProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderId: string, status: OrderStatus, message: string } | null>(null);

  
  const selectedWaiter = useMemo(() => {
    return waiters.find(w => w.userId === currentUser.id);
  }, [waiters, currentUser]);

  const { activeOrders, servedOrders } = useMemo(() => {
    if (!selectedWaiter) return { activeOrders: [], servedOrders: [] };
    const active: Order[] = [];
    const served: Order[] = [];
    orders.forEach(order => {
      if (order.waiterId === selectedWaiter.id) {
        if (order.status === 'served' || order.status === 'cancelled') {
          served.push(order);
        } else {
          active.push(order);
        }
      }
    });
    return { activeOrders: active.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), servedOrders: served.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
  }, [orders, selectedWaiter]);
  
  const availableTables = useMemo(() => {
    if (!selectedWaiter) return [];
    return tables.filter(table => table.status === 'available' || table.waiterId === selectedWaiter.id);
  }, [tables, selectedWaiter]);

  const handleConfirm = () => {
    if (confirmation) {
      onUpdateStatus(confirmation.orderId, confirmation.status);
      setConfirmation(null);
    }
  };


  if (!selectedWaiter) {
    return (
      <div className="text-center py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Waiter Profile Not Found</CardTitle>
            <CardDescription>We couldn't find a waiter profile linked to your user account. An administrator needs to create a waiter entry for your user: <span className="font-bold text-primary">{currentUser.email}</span></CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>You are logged in as <span className="font-semibold">{selectedWaiter.name}</span>.</p>
        <Button onClick={() => setIsOrderFormOpen(true)} disabled={!selectedWaiter.id || availableTables.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>

       <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="served">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activeOrders.length > 0 ? (
                    activeOrders.map(order => (
                        <OrderCard
                        key={order.id}
                        order={order}
                        menuItems={menuItems}
                        waiterName={selectedWaiter?.name || 'Unknown'}
                        actions={
                            order.status === 'prepared' ? (
                            <Button className="w-full" onClick={() => setConfirmation({ orderId: order.id, status: 'served', message: `This will mark the order for Table ${order.tableNumber} as served and complete the transaction.` })}>
                                <Utensils className="mr-2 h-4 w-4"/> Mark as Served
                            </Button>
                            ) : null
                        }
                        />
                    ))
                    ) : (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle>No Active Orders</CardTitle>
                                <CardDescription>
                                You have no active orders. Create a new one to get started.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    )}
                </div>
            </TabsContent>
            
            <TabsContent value="served" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {servedOrders.length > 0 ? (
                    servedOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            menuItems={menuItems}
                            waiterName={selectedWaiter?.name || 'Unknown'}
                        />
                    ))
                    ) : (
                     <div className="col-span-full text-center text-muted-foreground py-10">
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle>No Served Orders</CardTitle>
                                <CardDescription>
                                You have not served any orders yet.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    )}
                </div>
            </TabsContent>
      </Tabs>

      <OrderForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        menuItems={menuItems}
        waiterId={selectedWaiter.id}
        onCreateOrder={onCreateOrder}
        tables={availableTables}
      />
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
    </>
  );
}
