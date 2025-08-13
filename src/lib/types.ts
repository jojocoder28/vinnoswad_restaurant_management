

export type OrderStatus = 'pending' | 'approved' | 'prepared' | 'served' | 'cancelled' | 'billed';
export type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen';
export type UserStatus = 'pending' | 'approved';
export type BillStatus = 'unpaid' | 'paid';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  waiterId: string;
  timestamp: string;
  cancellationReason?: string;
}

export interface Bill {
    id: string;
    tableNumber: number;
    orderIds: string[];
    waiterId: string;
    subtotal: number;
    tax: number;
    total: number;
    status: BillStatus;
    timestamp: string;
}

export interface Waiter {
  id: string;
  name: string;
  userId: string;
}

export interface Table {
  id: string;
  tableNumber: number;
  status: 'available' | 'occupied';
  waiterId: string | null;
}

export interface User {
    id:string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string; // Should be a hash, and optional on the client
}

export interface DecodedToken {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

// Reports
export interface ReportData {
  reportPeriod: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    servedOrders: number;
    cancelledOrders: number;
    totalBills: number;
    totalUsers: number;
    totalMenuItems: number;
  };
  data: {
    orders: Omit<Order, 'id'>[];
    bills: Omit<Bill, 'id'>[];
    users: Omit<User, 'id' | 'password'>[];
    menuItems: Omit<MenuItem, 'id'>[];
    waiters: Omit<Waiter, 'id'>[];
  }
}
