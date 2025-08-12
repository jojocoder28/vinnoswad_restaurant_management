export type OrderStatus = 'pending' | 'approved' | 'ready' | 'served';

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
}
