export type OrderStatus = 'pending' | 'approved' | 'ready' | 'served';
export type UserRole = 'admin' | 'manager' | 'waiter';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  waiterId: string;
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
  waiterId?: string | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
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
