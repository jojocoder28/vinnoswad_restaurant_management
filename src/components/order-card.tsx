
import type { ReactNode } from 'react';
import type { Order, MenuItem, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface OrderCardProps {
  order: Order;
  menuItems: MenuItem[];
  waiterName: string;
  actions?: ReactNode;
  orderTotal?: number; // Optional prop for overriding the calculated total
}

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
  prepared: 'bg-purple-500/20 text-purple-700 border-purple-500/30 hover:bg-purple-500/30',
  served: 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30',
  billed: 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
  cancelled: 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
};

export default function OrderCard({ order, menuItems, waiterName, actions, orderTotal }: OrderCardProps) {
  const calculatedTotal = useMemo(() => {
    return order.items.reduce((total, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        // Use the price from the order item if available, otherwise fetch from menu
        const price = item.price || menuItem?.price || 0;
        return total + (price * item.quantity);
    }, 0);
  }, [order.items, menuItems]);

  const displayTotal = orderTotal !== undefined ? orderTotal : calculatedTotal;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className='font-headline'>Table {order.tableNumber}</CardTitle>
                <CardDescription>By: {waiterName}</CardDescription>
            </div>
            <Badge variant="outline" className={cn("capitalize", statusStyles[order.status])}>
                {order.status}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Separator />
        {order.status === 'cancelled' && order.cancellationReason && (
             <div className='text-sm text-destructive py-2'>
                <p className="font-bold">Cancellation Reason:</p>
                <p>{order.cancellationReason}</p>
             </div>
        )}
        <ScrollArea className="h-32 pr-4">
            <ul className="text-sm space-y-1 py-2">
            {order.items.map((item, index) => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                const price = item.price || menuItem?.price || 0;
                return (
                <li key={`${item.menuItemId}-${index}`} className="flex justify-between">
                    <span>{item.quantity}x {menuItem?.name || 'Unknown Item'}</span>
                    <span className="font-mono">₹{(price * item.quantity).toFixed(2)}</span>
                </li>
                );
            })}
            </ul>
        </ScrollArea>
        <Separator />
         <div className="flex justify-between font-bold pt-2">
            <span>Total</span>
            <span className="font-mono">₹{displayTotal.toFixed(2)}</span>
        </div>
      </CardContent>
      {actions && (
        <CardFooter>
          {actions}
        </CardFooter>
      )}
    </Card>
  );
}
