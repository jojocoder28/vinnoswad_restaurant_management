
import type { MenuItem, Order, Waiter, Table, User } from './types';
import bcrypt from 'bcryptjs';

// Note: In a real app, you would never store plaintext passwords.
// This is for demo purposes only. The registerUser function correctly hashes them.
const passwordHash = bcrypt.hashSync('123456', 10);

export const initialUsers: Omit<User, 'id'>[] = [
    { name: 'Admin User', email: 'admin@vinnoswad.com', role: 'admin', password: passwordHash, status: 'approved' },
    { name: 'Manager User', email: 'manager@vinnoswad.com', role: 'manager', password: passwordHash, status: 'approved' },
    { name: 'Kitchen User', email: 'kitchen@vinnoswad.com', role: 'kitchen', password: passwordHash, status: 'approved' },
    { name: 'Arjun Kumar', email: 'arjun@vinnoswad.com', role: 'waiter', password: passwordHash, status: 'approved' },
    { name: 'Priya Sharma', email: 'priya@vinnoswad.com', role: 'waiter', password: passwordHash, status: 'approved' },
    { name: 'Rohan Mehta', email: 'rohan@vinnoswad.com', role: 'waiter', password: passwordHash, status: 'approved' },
];

export const initialWaiters: Omit<Waiter, 'id' | 'userId'>[] = [
  { name: 'Arjun Kumar' },
  { name: 'Priya Sharma' },
  { name: 'Rohan Mehta' },
];

export const initialMenuItems: Omit<MenuItem, "id">[] = [
  { name: 'Margherita Pizza', price: 12.50, category: 'Main Course', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Caesar Salad', price: 8.00, category: 'Starters', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Spaghetti Carbonara', price: 15.00, category: 'Main Course', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Tiramisu', price: 6.50, category: 'Desserts', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Bruschetta', price: 7.00, category: 'Starters', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Grilled Salmon', price: 18.00, category: 'Main Course', imageUrl: 'https://placehold.co/400x300.png', isAvailable: false },
  { name: 'Coke', price: 2.50, category: 'Drinks', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
  { name: 'Water', price: 1.00, category: 'Drinks', imageUrl: 'https://placehold.co/400x300.png', isAvailable: true },
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
