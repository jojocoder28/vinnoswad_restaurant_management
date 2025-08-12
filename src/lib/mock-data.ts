import type { MenuItem, Order, Waiter, Table } from './types';

export const initialWaiters: Waiter[] = [
  { id: 'WTR-001', name: 'Alex' },
  { id: 'WTR-002', name: 'Maria' },
  { id: 'WTR-003', name: 'John' },
];

export const initialMenuItems: MenuItem[] = [
  { id: 'ITEM-001', name: 'Margherita Pizza', price: 12.50, category: 'Main' },
  { id: 'ITEM-002', name: 'Caesar Salad', price: 8.00, category: 'Appetizer' },
  { id: 'ITEM-003', name: 'Spaghetti Carbonara', price: 15.00, category: 'Main' },
  { id: 'ITEM-004', name: 'Tiramisu', price: 6.50, category: 'Dessert' },
  { id: 'ITEM-005', name: 'Bruschetta', price: 7.00, category: 'Appetizer' },
  { id: 'ITEM-006', name: 'Grilled Salmon', price: 18.00, category: 'Main' },
  { id: 'ITEM-007', name: 'Coke', price: 2.50, category: 'Drink' },
  { id: 'ITEM-008', name: 'Water', price: 1.00, category: 'Drink' },
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-004',
    tableNumber: 3,
    items: [
      { menuItemId: 'ITEM-005', quantity: 1 },
    ],
    status: 'served',
    waiterId: 'WTR-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export const initialTables: Table[] = [
  { id: 'TBL-001', tableNumber: 1, status: 'available' },
  { id: 'TBL-002', tableNumber: 2, status: 'available' },
  { id: 'TBL-003', tableNumber: 3, status: 'occupied' },
  { id: 'TBL-004', tableNumber: 4, status: 'available' },
  { id: 'TBL-005', tableNumber: 5, status: 'available' },
  { id: 'TBL-006', tableNumber: 6, status: 'available' },
  { id: 'TBL-007', tableNumber: 7, status: 'available' },
  { id: 'TBL-008', tableNumber: 8, status: 'available' },
];
