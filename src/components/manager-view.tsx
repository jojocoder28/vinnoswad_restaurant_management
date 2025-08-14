
"use client";

import type { Order, MenuItem, OrderStatus, Waiter, Bill, DecodedToken, Table } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Utensils, Package, Clock, ShieldAlert, XCircle, FileText, Printer } from 'lucide-react';
import OrderCard from './order-card';
import MenuManagement from './menu-management';
import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import CancelOrderForm from './cancel-order-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import BillingModal from './billing-modal';
import { Separator } from './ui/separator';
import DashboardNav from './dashboard-nav';

interface ManagerViewProps {
  orders: Order[];
  bills: Bill[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onCreateBill: (tableNumber: number) => Promise<Bill | void>;
  onPayBill: (billId: string) => void;
  currentUser: DecodedToken;
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
  bills,
  menuItems,
  waiters,
  tables,
  onUpdateStatus,
  onCancelOrder,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onCreateBill,
  onPayBill,
  currentUser
}: ManagerViewProps) {
  
  const [confirmation, setConfirmation] = useState<{ orderId: string, status: OrderStatus, message: string } | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  const preparedOrders = useMemo(() => orders.filter(o => o.status === 'prepared'), [orders]);
  const servedOrders = useMemo(() => orders.filter(o => o.status === 'served' || o.status === 'billed'), [orders]);
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
        if (order.status === 'served' || order.status === 'billed') {
          dailyItemsServed += itemCount;
        }
      }
    });

    return { dailyItemsOrdered, dailyItemsServed };
  }, [orders]);
  
  const { tablesToBill, unpaidBills } = useMemo(() => {
    const managerUnpaidBills = bills.filter(b => b.status === 'unpaid');
    const tablesWithUnpaidBills = new Set(managerUnpaidBills.map(b => b.tableNumber));
  
    // Group orders by table number
    const ordersByTable = orders.reduce((acc, order) => {
        if (!['billed', 'cancelled'].includes(order.status)) { // Only consider active orders
            if (!acc[order.tableNumber]) {
                acc[order.tableNumber] = [];
            }
            acc[order.tableNumber].push(order);
        }
        return acc;
    }, {} as Record<number, Order[]>);
  
    const readyForBill: number[] = [];
    for (const tableNum in ordersByTable) {
        const tableOrders = ordersByTable[tableNum];
        // A table is ready to be billed if it has active orders and ALL of them are 'served'
        const allServed = tableOrders.length > 0 && tableOrders.every(o => o.status === 'served');
        
        if (allServed && !tablesWithUnpaidBills.has(Number(tableNum))) {
            readyForBill.push(Number(tableNum));
        }
    }
  
    return { tablesToBill: readyForBill.sort((a,b) => a-b), unpaidBills: managerUnpaidBills };
  }, [orders, bills]);


  const handleGenerateBill = async (tableNumber: number) => {
    const newBill = await onCreateBill(tableNumber);
    if(newBill) {
        setActiveBill(newBill);
    }
  }

  const handleViewBill = (bill: Bill) => {
    setActiveBill(bill);
  };


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
        case 'prepared':
             return (
                <span className='text-sm text-muted-foreground'>Waiting for waiter...</span>
             );
        default:
            return null;
    }
  }

  const navItems = [
    {
        value: "orders",
        label: "Manage Orders",
        content: (
            <div className="space-y-8">
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
                <h3 className="text-xl font-headline font-semibold mb-4">Ready to Serve</h3>
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
                                <CardDescription>No orders are currently waiting to be served.</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>
                </div>
            </div>
        )
    },
    {
        value: "menu",
        label: "Manage Menu",
        content: (
            <MenuManagement
                menuItems={menuItems}
                onAddMenuItem={onAddMenuItem}
                onUpdateMenuItem={onUpdateMenuItem}
                onDeleteMenuItem={onDeleteMenuItem}
                currentUserRole='manager'
            />
        )
    },
    {
        value: "billing",
        label: "Billing",
        content: (
            <div className="space-y-8">
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
                                    <Button className="w-full" onClick={() => handleGenerateBill(tableNum)}>
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
          </div>
        )
    },
    {
        value: "served",
        label: "Served History",
        content: (
            <div>
                <h3 className="text-xl font-headline font-semibold mb-4">Served & Billed Orders</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {servedOrders.length > 0 ? (
                    servedOrders.map(order => (
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
                                <CardTitle>No Served Orders</CardTitle>
                                <CardDescription>There are no completed orders to display.</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>
            </div>
        )
    },
    {
        value: "cancelled",
        label: "Cancelled",
        content: (
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
        )
    }
  ];


  return (
    <>
      <DashboardNav items={navItems} />

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

      {activeBill && (
          <BillingModal
              isOpen={!!activeBill}
              onClose={() => setActiveBill(null)}
              bill={activeBill}
              onPayBill={onPayBill}
              orders={orders.filter(o => activeBill?.orderIds.includes(o.id))}
              menuItems={menuItems}
              currentUser={currentUser}
          />
      )}
    </>
  );
}
