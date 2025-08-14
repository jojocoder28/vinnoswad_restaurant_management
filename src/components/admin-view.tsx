
"use client";

import type { Order, MenuItem, Waiter, User, UserStatus, DecodedToken, Table, Supplier, StockItem, PurchaseOrder, StockUsageLog } from '@/lib/types';
import StatsCards from './stats-cards';
import RevenueCharts from './revenue-charts';
import { useMemo, useState } from 'react';
import UserManagement from './user-management';
import LiveStatusDashboard from './live-status-dashboard';
import ServedOrdersList from './served-orders-list';
import CancelledOrdersList from './cancelled-orders-list';
import ReportGenerator from './report-generator';
import MenuManagement from './menu-management';
import SupplyChainManagement from './supply-chain-management';
import ProfitLossAnalysis from './profit-loss-analysis';
import DashboardNav from './dashboard-nav';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';

interface AdminViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  users: User[];
  tables: Table[];
  suppliers: Supplier[];
  stockItems: StockItem[];
  purchaseOrders: PurchaseOrder[];
  stockUsageLogs: StockUsageLog[];
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (userData: Omit<User, 'id' | 'status'>) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddSupplier: (data: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (data: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddStockItem: (data: Omit<StockItem, 'id'>) => void;
  onUpdateStockItem: (data: StockItem) => void;
  onDeleteStockItem: (id: string) => void;
  onAddPurchaseOrder: (data: Omit<PurchaseOrder, 'id'>) => void;
  onReceivePurchaseOrder: (id: string) => void;
  currentUser: DecodedToken;
}

export default function AdminView({ 
    orders, 
    menuItems, 
    waiters, 
    users, 
    tables,
    suppliers,
    stockItems,
    purchaseOrders,
    stockUsageLogs,
    onUpdateUserStatus, 
    onDeleteUser,
    onCreateUser, 
    onAddMenuItem,
    onUpdateMenuItem,
    onDeleteMenuItem,
    onAddSupplier,
    onUpdateSupplier,
    onDeleteSupplier,
    onAddStockItem,
    onUpdateStockItem,
    onDeleteStockItem,
    onAddPurchaseOrder,
    onReceivePurchaseOrder,
    currentUser 
}: AdminViewProps) {
  const servedOrders = useMemo(() => orders.filter(o => o.status === 'served' || o.status === 'billed'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'cancelled'), [orders]);

  const totalRevenue = useMemo(() => {
    return servedOrders.reduce((total, order) => {
      const orderTotal = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      return total + orderTotal;
    }, 0);
  }, [servedOrders]);

  const totalOrders = useMemo(() => orders.length, [orders]);
  const totalMenuItems = useMemo(() => menuItems.length, [menuItems]);
  
  const [activeInventoryTab, setActiveInventoryTab] = useState('stock');

  const navItems = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: (
        <div className="space-y-8">
            <StatsCards 
                totalRevenue={totalRevenue} 
                totalOrders={totalOrders} 
                servedOrders={servedOrders.length}
                cancelledOrders={cancelledOrders.length}
                totalMenuItems={totalMenuItems}
            />
            <RevenueCharts orders={servedOrders} menuItems={menuItems} waiters={waiters} tables={tables} />
        </div>
      )
    },
    {
        value: "status",
        label: "Restaurant Status",
        content: <LiveStatusDashboard orders={orders} menuItems={menuItems} waiters={waiters} tables={tables} />
    },
    {
        value: "menu",
        label: "Menu",
        content: (
            <MenuManagement
                menuItems={menuItems}
                onAddMenuItem={onAddMenuItem}
                onUpdateMenuItem={onUpdateMenuItem}
                onDeleteMenuItem={onDeleteMenuItem}
                currentUserRole={currentUser.role}
            />
        )
    },
    {
        value: "inventory",
        label: "Inventory",
        content: (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-2">
                           <div className="flex flex-col gap-1">
                             <Button variant={activeInventoryTab === 'stock' ? 'secondary' : 'ghost'} onClick={() => setActiveInventoryTab('stock')} className="justify-start">Stock & Recipes</Button>
                             <Button variant={activeInventoryTab === 'logs' ? 'secondary' : 'ghost'} onClick={() => setActiveInventoryTab('logs')} className="justify-start">Manual Usage Logs</Button>
                             <Button variant={activeInventoryTab === 'pnl' ? 'secondary' : 'ghost'} onClick={() => setActiveInventoryTab('pnl')} className="justify-start">P&L Analysis</Button>
                           </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                   {activeInventoryTab === 'stock' && (
                        <SupplyChainManagement 
                            suppliers={suppliers}
                            stockItems={stockItems}
                            purchaseOrders={purchaseOrders}
                            menuItems={menuItems}
                            onAddSupplier={onAddSupplier}
                            onUpdateSupplier={onUpdateSupplier}
                            onDeleteSupplier={onDeleteSupplier}
                            onAddStockItem={onAddStockItem}
                            onUpdateStockItem={onUpdateStockItem}
                            onDeleteStockItem={onDeleteStockItem}
                            onAddPurchaseOrder={onAddPurchaseOrder}
                            onReceivePurchaseOrder={onReceivePurchaseOrder}
                            onUpdateMenuItem={onUpdateMenuItem}
                        />
                   )}
                   {activeInventoryTab === 'logs' && (
                       <Card>
                            <CardHeader>
                                <CardTitle>Manual Stock Usage Logs</CardTitle>
                                <CardDescription>History of all manually recorded stock usage by managers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[600px]">
                                    <UiTable>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Recorded By</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stockUsageLogs.map(log => {
                                                const stockItem = stockItems.find(si => si.id === log.stockItemId);
                                                const manager = users.find(u => u.id === log.recordedBy);
                                                return (
                                                    <TableRow key={log.id}>
                                                        <TableCell>{format(new Date(log.timestamp), 'dd/MM/yy p')}</TableCell>
                                                        <TableCell>{stockItem?.name || 'N/A'}</TableCell>
                                                        <TableCell>{log.quantityUsed} {stockItem?.unit}</TableCell>
                                                        <TableCell className="capitalize">{log.category.replace('_', ' ')}</TableCell>
                                                        <TableCell>{manager?.name || 'N/A'}</TableCell>
                                                        <TableCell>{log.notes || 'N/A'}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </UiTable>
                                </ScrollArea>
                            </CardContent>
                       </Card>
                   )}
                   {activeInventoryTab === 'pnl' && <ProfitLossAnalysis menuItems={menuItems} orders={servedOrders} />}
                </div>
            </div>
        )
    },
    {
        value: "history",
        label: "Order History",
        content: (
            <div className="space-y-8">
                <ServedOrdersList 
                    orders={servedOrders}
                    waiters={waiters}
                />
                <CancelledOrdersList
                    orders={cancelledOrders}
                    waiters={waiters}
                />
            </div>
        )
    },
    {
        value: "users",
        label: "Staff & Users",
        content: (
            <UserManagement 
                users={users}
                orders={orders}
                menuItems={menuItems}
                waiters={waiters}
                onUpdateUserStatus={onUpdateUserStatus}
                onDeleteUser={onDeleteUser}
                onCreateUser={onCreateUser}
                currentUser={currentUser}
             />
        )
    },
    {
        value: "reports",
        label: "Reports",
        content: <ReportGenerator />
    }
  ];

  return <DashboardNav items={navItems} />;
}
