
"use client";

import type { Order, Waiter } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface ServedOrdersListProps {
  orders: Order[];
  waiters: Waiter[];
}

export default function ServedOrdersList({ orders, waiters }: ServedOrdersListProps) {
  
  const getWaiterName = (waiterId: string) => {
    return waiters.find(w => w.id === waiterId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-headline font-semibold">Served Order History</h3>
      <Card className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table No.</TableHead>
              <TableHead>Waiter</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => {
               const orderTotal = order.items.reduce((total, item) => {
                  return total + (item.price * item.quantity);
               }, 0);
               const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);

              return (
                 <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.tableNumber}</TableCell>
                    <TableCell>{getWaiterName(order.waiterId)}</TableCell>
                    <TableCell>{format(new Date(order.timestamp), "PPpp")}</TableCell>
                    <TableCell className="text-center">{totalItems}</TableCell>
                    <TableCell className="text-right font-mono">₹{orderTotal.toFixed(2)}</TableCell>
                </TableRow>
              )
            })}
             {orders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No served orders found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
