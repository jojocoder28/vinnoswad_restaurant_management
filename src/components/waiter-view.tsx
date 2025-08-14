
"use client";

import React, { useMemo, useState } from 'react';
import type { Order, MenuItem, Waiter, OrderStatus, Table, DecodedToken, OrderItem, Bill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, ShieldAlert, FileText, Check, MoreHorizontal, FilePenLine, XCircle, Printer } from 'lucide-react';
import OrderCard from './order-card';
import OrderForm from './order-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import BillingModal from './billing-modal';
import DashboardNav from './dashboard-nav';


interface WaiterViewProps {
  orders: Order[];
  bills: Bill[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'items'> & { items: Omit<OrderItem, 'price'>[] }, tableId: string) => void;
  onUpdateOrder: (orderId: string, items: Omit<OrderItem, 'price'>[]) => void;
  onDeleteOrder: (orderId: string) => void;
  currentUser: DecodedToken;
}

export default function WaiterView({ orders, bills, menuItems, waiters, tables, onUpdateStatus, onCreateOrder, onUpdateOrder, onDeleteOrder, currentUser }: WaiterViewProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: 'status' | 'delete', orderId: string, status?: OrderStatus, message: string } | null>(null);
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  
  const selectedWaiter = useMemo(() => {
    return waiters.find(w => w.userId === currentUser.id);
  }, [waiters, currentUser]);

  const { activeOrders, orderHistory } = useMemo(() => {
    if (!selectedWaiter) return { activeOrders: [], orderHistory: [] };
    const active: Order[] = [];
    const history: Order[] = [];
    orders.forEach(order => {
      if (order.waiterId === selectedWaiter.id) {
        if (['served', 'cancelled', 'billed'].includes(order.status)) {
          history.push(order);
        } else {
          active.push(order);
        }
      }
    });
    return { 
        activeOrders: active.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), 
        orderHistory: history.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
    };
  }, [orders, selectedWaiter]);
  
  const availableTablesForNewOrder = useMemo(() => {
    if (!selectedWaiter) return [];
    // For new orders, only completely available tables
    return tables.filter(table => table.status === 'available');
  }, [tables, selectedWaiter]);
  
  const tablesForEditing = useMemo(() => {
     if (!selectedWaiter) return [];
     // For editing, waiter can see their own tables + available ones
     return tables.filter(table => table.status === 'available' || table.waiterId === selectedWaiter.id);
  }, [tables, selectedWaiter]);

  const handleViewBill = (bill: Bill) => {
    setActiveBill(bill);
  };


  const handleConfirm = () => {
    if (confirmation) {
      if(confirmation.type === 'status' && confirmation.status) {
        onUpdateStatus(confirmation.orderId, confirmation.status);
      } else if (confirmation.type === 'delete') {
        onDeleteOrder(confirmation.orderId);
      }
      setConfirmation(null);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  }

  const handleCreateNewOrder = () => {
    setEditingOrder(null);
    setIsOrderFormOpen(true);
  }
  
  const renderOrderActions = (order: Order, isHistory: boolean = false) => {
    
    if (isHistory) {
        if (order.status === 'billed') {
            const relatedBill = bills.find(b => b.orderIds.includes(order.id));
            if(relatedBill) {
                return (
                    <Button variant="outline" className="w-full" onClick={() => handleViewBill(relatedBill)}>
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                )
            }
        }
        return null;
    }

    const actions: React.ReactNode[] = [];
    if (order.status === 'pending') {
        actions.push(
            <DropdownMenu key="actions-menu">
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                        <FilePenLine className="mr-2 h-4 w-4" /> Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => setConfirmation({ type: 'delete', orderId: order.id, message: `This will permanently cancel the order for Table ${order.tableNumber}. This action cannot be undone.`})}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if(order.status === 'prepared') {
        return (
            <Button className="w-full" onClick={() => setConfirmation({ type: 'status', orderId: order.id, status: 'served', message: `This will mark the order for Table ${order.tableNumber} as served.` })}>
                <Utensils className="mr-2 h-4 w-4"/> Mark as Served
            </Button>
        )
    }

    return actions.length > 0 ? <div className="flex items-center justify-end w-full">{actions}</div> : null;
  }


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

  const navItems = [
    {
        value: "active",
        label: "Active Orders",
        content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                    <OrderCard
                    key={order.id}
                    order={order}
                    menuItems={menuItems}
                    waiterName={selectedWaiter?.name || 'Unknown'}
                    actions={renderOrderActions(order)}
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
        )
    },
    {
        value: "history",
        label: "Order History",
        content: (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orderHistory.length > 0 ? (
                orderHistory.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        menuItems={menuItems}
                        waiterName={selectedWaiter?.name || 'Unknown'}
                        actions={renderOrderActions(order, true)}
                    />
                ))
                ) : (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No Order History</CardTitle>
                            <CardDescription>
                            You have no past orders to display yet.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                )}
            </div>
        )
    }
  ];

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>You are logged in as <span className="font-semibold">{selectedWaiter.name}</span>.</p>
        <Button className="w-full sm:w-auto" onClick={handleCreateNewOrder} disabled={!selectedWaiter.id || availableTablesForNewOrder.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>
      <DashboardNav items={navItems} />

      <OrderForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        menuItems={menuItems}
        waiterId={selectedWaiter.id}
        onCreateOrder={onCreateOrder}
        onUpdateOrder={onUpdateOrder}
        tables={editingOrder ? tablesForEditing : availableTablesForNewOrder}
        editingOrder={editingOrder}
      />
    </div>

     <AlertDialog open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    {confirmation?.message}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmation(null)}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm} variant={confirmation?.type === 'delete' ? 'destructive' : 'default'}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {activeBill && (
        <BillingModal
            isOpen={!!activeBill}
            onClose={() => setActiveBill(null)}
            bill={activeBill}
            onPayBill={() => {}}
            orders={orders.filter(o => activeBill?.orderIds.includes(o.id))}
            menuItems={menuItems}
            currentUser={currentUser}
        />
    )}
    </>
  );
}

    