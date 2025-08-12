import type { MenuItem, Order, Waiter, Table, User } from './types';
import bcrypt from 'bcryptjs';

// Note: In a real app, you would never store plaintext passwords.
// This is for demo purposes only. The registerUser function correctly hashes them.
const passwordHash = bcrypt.hashSync('123456', 10);

export const initialUsers: Omit<User, 'id'>[] = [
    { name: 'Admin User', email: 'admin@eatery.com', role: 'admin', password: passwordHash, status: 'approved' },
    { name: 'Manager User', email: 'manager@eatery.com', role: 'manager', password: passwordHash, status: 'approved' },
    { name: 'Arjun Kumar', email: 'arjun@eatery.com', role: 'waiter', password: passwordHash, status: 'approved' },
    { name: 'Priya Sharma', email: 'priya@eatery.com', role: 'waiter', password: passwordHash, status: 'approved' },
    { name: 'Rohan Mehta', email: 'rohan@eatery.com', role: 'waiter', password: passwordHash, status: 'approved' },
];

export const initialWaiters: Omit<Waiter, 'id' | 'userId'>[] = [
  { name: 'Arjun Kumar' },
  { name: 'Priya Sharma' },
  { name: 'Rohan Mehta' },
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

export const initialOrders: Order[] = [];

export const initialTables: Table[] = [
  { id: 'TBL-001', tableNumber: 1, status: 'available', waiterId: null },
  { id: 'TBL-002', tableNumber: 2, status: 'available', waiterId: null },
  { id: 'TBL-003', tableNumber: 3, status: 'available', waiterId: null },
  { id: 'TBL-004', tableNumber: 4, status: 'available', waiterId: null },
  { id: 'TBL-005', tableNumber: 5, status: 'available', waiterId: null },
  { id: 'TBL-006', tableNumber: 6, status: 'available', waiterId: null },
  { id: 'TBL-007', tableNumber: 7, status: 'available', waiterId: null },
  { id: 'TBL-008', tableNumber: 8, status: 'available', waiterId: null },
];
