"use client";

import React, { useMemo, useState } from 'react';
import type { Order, MenuItem, Waiter, OrderStatus, Table } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import OrderCard from './order-card';
import OrderForm from './order-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WaiterViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status'>, tableId: string) => void;
}

export default function WaiterView({ orders, menuItems, waiters, tables, onUpdateStatus, onCreateOrder }: WaiterViewProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(waiters[0]?.id || '');

  const { activeOrders, servedOrders } = useMemo(() => {
    const active: Order[] = [];
    const served: Order[] = [];
    orders.forEach(order => {
      if (order.waiterId === selectedWaiterId) {
        if (order.status === 'served') {
          served.push(order);
        } else {
          active.push(order);
        }
      }
    });
    return { activeOrders: active, servedOrders: served.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
  }, [orders, selectedWaiterId]);
  
  const availableTables = useMemo(() => {
    return tables.filter(table => table.status === 'available' || table.waiterId === selectedWaiterId);
  }, [tables, selectedWaiterId]);

  const selectedWaiter = useMemo(() => waiters.find(w => w.id === selectedWaiterId), [waiters, selectedWaiterId]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Viewing as:</span>
            <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Waiter" />
              </SelectTrigger>
              <SelectContent>
                {waiters.map(waiter => (
                  <SelectItem key={waiter.id} value={waiter.id}>{waiter.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <Button onClick={() => setIsOrderFormOpen(true)} disabled={!selectedWaiterId || availableTables.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>

       <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="served">Served History</TabsTrigger>
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
                            order.status === 'ready' ? (
                            <Button className="w-full" onClick={() => onUpdateStatus(order.id, 'served')}>
                                Mark as Served
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
                                {selectedWaiter?.name || 'This waiter'} has no active orders. Create a new one to get started.
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
                                {selectedWaiter?.name || 'This waiter'} has not served any orders yet.
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
        waiterId={selectedWaiterId}
        onCreateOrder={onCreateOrder}
        tables={availableTables}
      />
    </div>
  );
}
