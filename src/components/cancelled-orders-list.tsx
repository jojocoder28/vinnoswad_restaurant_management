
"use client";

import type { Order, Waiter } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

interface CancelledOrdersListProps {
  orders: Order[];
  waiters: Waiter[];
}

export default function CancelledOrdersList({ orders, waiters }: CancelledOrdersListProps) {
  
  const getWaiterName = (waiterId: string) => {
    return waiters.find(w => w.id === waiterId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-headline font-semibold">Cancelled Order History</h3>
      <Card className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table No.</TableHead>
              <TableHead>Waiter</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Reason for Cancellation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.tableNumber}</TableCell>
                <TableCell>{getWaiterName(order.waiterId)}</TableCell>
                <TableCell>{format(new Date(order.timestamp), "PPpp")}</TableCell>
                <TableCell className="text-destructive">{order.cancellationReason || "No reason provided."}</TableCell>
              </TableRow>
            ))}
             {orders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    No cancelled orders found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
