

export type OrderStatus = 'pending' | 'approved' | 'prepared' | 'served' | 'cancelled' | 'billed';
export type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen';
export type UserStatus = 'pending' | 'approved';
export type BillStatus = 'unpaid' | 'paid';
export type PurchaseStatus = 'ordered' | 'received' | 'cancelled';
export type StockUsageCategory = 'kitchen_prep' | 'spillage' | 'staff_meal' | 'other';


export interface MenuItemIngredient {
  stockItemId: string;
  quantity: number; // The amount of the stock item used in this menu item
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  ingredients: MenuItemIngredient[];
  costOfGoods: number;
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
    waiterId?: string; // Optional as manager handles billing
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

// Supply Chain & P&L
export interface StockItem {
  id: string;
  name: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'piece';
  quantityInStock: number;
  lowStockThreshold: number;
  averageCostPerUnit: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
}

export interface PurchaseOrderItem {
  stockItemId: string;
  quantity: number;
  costPerUnit: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  date: string;
  status: PurchaseStatus;
}

export interface StockUsageLog {
    id: string;
    stockItemId: string;
    quantityUsed: number;
    category: StockUsageCategory;
    notes?: string;
    recordedBy: string; // User ID of the manager
    timestamp: string;
}


// Report-specific types
export interface OrderReportItem extends OrderItem {
  itemName: string;
}

export interface OrderReport extends Omit<Order, 'items' | 'waiterId'> {
  waiterName: string;
  items: OrderReportItem[];
}

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
    orders: OrderReport[];
    bills: Bill[];
    users: Omit<User, 'id' | 'password'>[];
    menuItems: MenuItem[];
    waiters: Waiter[];
  }
}

// Payment Gateway Types
export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: 'created' | 'attempted' | 'paid';
    attempts: number;
    notes: any[];
    created_at: number;
}
