
"use client";

import React, { useMemo, useState } from 'react';
import type { Order, MenuItem, Waiter, OrderStatus, Table, DecodedToken, OrderItem, Bill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, ShieldAlert, FileText, Check, MoreHorizontal, FilePenLine, XCircle } from 'lucide-react';
import OrderCard from './order-card';
import OrderForm from './order-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import BillingModal from './billing-modal';
import { Separator } from './ui/separator';


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
  onCreateBill: (tableNumber: number, waiterId: string) => Promise<Bill | void>;
  onPayBill: (billId: string) => void;
  currentUser: DecodedToken;
}

export default function WaiterView({ orders, bills, menuItems, waiters, tables, onUpdateStatus, onCreateOrder, onUpdateOrder, onDeleteOrder, onCreateBill, onPayBill, currentUser }: WaiterViewProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: 'status' | 'delete', orderId: string, status?: OrderStatus, message: string } | null>(null);
  const [billingModalState, setBillingModalState] = useState<{ isOpen: boolean; bill: Bill | null }>({ isOpen: false, bill: null });

  
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

  const { tablesToBill, unpaidBills } = useMemo(() => {
    if (!selectedWaiter) return { tablesToBill: [], unpaidBills: [] };
    const waiterUnpaidBills = bills.filter(b => b.waiterId === selectedWaiter.id && b.status === 'unpaid');
    
    const tableNumbersWithServedOrders = new Set(
        orders.filter(o => o.status === 'served' && o.waiterId === selectedWaiter.id).map(o => o.tableNumber)
    );
    
    const tablesWithUnpaidBills = new Set(waiterUnpaidBills.map(b => b.tableNumber));
    
    const readyForBill = Array.from(tableNumbersWithServedOrders).filter(tn => !tablesWithUnpaidBills.has(tn));

    return { tablesToBill: readyForBill, unpaidBills: waiterUnpaidBills };
  }, [orders, bills, selectedWaiter]);
  
  const handleGenerateBill = async (tableNumber: number, waiterId: string) => {
    const newBill = await onCreateBill(tableNumber, waiterId);
    if(newBill) {
        setBillingModalState({ isOpen: true, bill: newBill });
    }
  }

  const handleViewBill = (bill: Bill) => {
    setBillingModalState({ isOpen: true, bill: bill });
  };

  const handleCloseBillingModal = () => {
    setBillingModalState({ isOpen: false, bill: null });
  }

  const handlePayBillFromModal = (billId: string) => {
    onPayBill(billId);
    handleCloseBillingModal();
  }


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
  
  const renderOrderActions = (order: Order) => {
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

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>You are logged in as <span className="font-semibold">{selectedWaiter.name}</span>.</p>
        <Button onClick={handleCreateNewOrder} disabled={!selectedWaiter.id || availableTablesForNewOrder.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>

       <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="history">Order History</TabsTrigger>
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
            </TabsContent>

            <TabsContent value="billing" className="mt-4 space-y-8">
                 <div>
                    <h3 className="text-xl font-headline font-semibold mb-4">Unpaid Bills</h3>
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {unpaidBills.length > 0 ? (
                            unpaidBills.map(bill => (
                                <Card key={bill.id} className="bg-amber-500/10 border-amber-500/20">
                                    <CardHeader>
                                        <CardTitle>Table {bill.tableNumber}</CardTitle>
                                        <CardDescription>Unpaid Bill Total: <span className="font-bold font-mono">₹{bill.total.toFixed(2)}</span></CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" variant="outline" onClick={() => handleViewBill(bill)}>
                                            <FileText className="mr-2 h-4 w-4"/> View Bill
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <div className="col-span-full text-center text-muted-foreground py-10">
                                <Card className="border-dashed">
                                    <CardHeader>
                                        <CardTitle>No Unpaid Bills</CardTitle>
                                        <CardDescription>
                                        All generated bills have been paid.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h3 className="text-xl font-headline font-semibold mb-4">Tables Ready to Bill</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {tablesToBill.length > 0 ? (
                            tablesToBill.map(tableNum => (
                                <Card key={tableNum}>
                                    <CardHeader>
                                        <CardTitle>Table {tableNum}</CardTitle>
                                        <CardDescription>This table has served orders ready for billing.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" onClick={() => handleGenerateBill(tableNum, selectedWaiter.id)}>
                                            <FileText className="mr-2 h-4 w-4"/> Generate Bill & QR Code
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-muted-foreground py-10">
                                <Card className="border-dashed">
                                    <CardHeader>
                                        <CardTitle>No Tables to Bill</CardTitle>
                                        <CardDescription>
                                        There are no tables with served orders waiting to be billed.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {orderHistory.length > 0 ? (
                    orderHistory.map(order => (
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
                                <CardTitle>No Order History</CardTitle>
                                <CardDescription>
                                You have no past orders to display yet.
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

    {billingModalState.isOpen && billingModalState.bill && (
        <BillingModal
            isOpen={billingModalState.isOpen}
            onClose={handleCloseBillingModal}
            bill={billingModalState.bill}
            onPayBill={handlePayBillFromModal}
            orders={orders.filter(o => billingModalState.bill?.orderIds.includes(o.id))}
            menuItems={menuItems}
        />
    )}
    </>
  );
}
