
"use client";

import type { Order, MenuItem, Waiter, User, UserStatus, DecodedToken, Table, Supplier, StockItem, PurchaseOrder } from '@/lib/types';
import StatsCards from './stats-cards';
import RevenueCharts from './revenue-charts';
import { useMemo } from 'react';
import UserManagement from './user-management';
import LiveStatusDashboard from './live-status-dashboard';
import ServedOrdersList from './served-orders-list';
import CancelledOrdersList from './cancelled-orders-list';
import ReportGenerator from './report-generator';
import MenuManagement from './menu-management';
import SupplyChainManagement from './supply-chain-management';
import ProfitLossAnalysis from './profit-loss-analysis';
import DashboardNav from './dashboard-nav';

interface AdminViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  users: User[];
  tables: Table[];
  suppliers: Supplier[];
  stockItems: StockItem[];
  purchaseOrders: PurchaseOrder[];
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
        )
    },
    {
        value: "pnl",
        label: "P&L Analysis",
        content: <ProfitLossAnalysis menuItems={menuItems} orders={servedOrders} />
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
