'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { initialMenuItems, initialOrders, initialWaiters, initialTables, initialUsers } from '@/lib/mock-data';
import type { MenuItem, Order, OrderStatus, Waiter, Table, User } from '@/lib/types';
import { Collection, ObjectId } from 'mongodb';

async function getCollection<T extends { id: string }>(collectionName: string): Promise<Collection<Omit<T, 'id'>>> {
    const { db } = await connectToDatabase();
    return db.collection<Omit<T, 'id'>>(collectionName);
}

async function seedCollection<T extends { id: string }>(collectionName: string, data: T[]) {
    const collection = await getCollection(collectionName);
    const count = await collection.countDocuments();
    if (count === 0) {
        // We are dropping the ID from the mock data, and letting Mongo create it
        const documents = data.map(({ id, ...rest }) => rest);
        await collection.insertMany(documents as any[]);
    }
}

export async function seedDatabase() {
    await seedCollection('menu', initialMenuItems);
    await seedCollection('waiters', initialWaiters);
    await seedCollection('orders', initialOrders);
    await seedCollection('tables', initialTables);
    await seedCollection('users', initialUsers);
}

function mapId<T>(document: any): T {
  if (!document) return document;
  const { _id, ...rest } = document;
  return { id: _id.toHexString(), ...rest } as T;
}

// User Actions
export async function getUsers(): Promise<User[]> {
    const usersCollection = await getCollection<User>('users');
    const users = await usersCollection.find().toArray();
    return users.map(user => mapId<User>(user));
}

export async function getUser(userId: string): Promise<User | null> {
    const usersCollection = await getCollection<User>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    return mapId<User>(user);
}


// Table Actions
export async function getTables(): Promise<Table[]> {
    const tablesCollection = await getCollection<Table>('tables');
    const tables = await tablesCollection.find().sort({ tableNumber: 1 }).toArray();
    return tables.map(table => mapId<Table>(table));
}

export async function updateTableStatus(tableId: string, status: 'available' | 'occupied', waiterId?: string | null): Promise<void> {
    const tablesCollection = await getCollection<Table>('tables');
    await tablesCollection.updateOne(
        { _id: new ObjectId(tableId) },
        { $set: { status, waiterId: waiterId ?? null } }
    );
    revalidatePath('/');
    revalidatePath('/waiter');
}


// Order Actions
export async function getOrders(): Promise<Order[]> {
    const ordersCollection = await getCollection<Order>('orders');
    const orders = await ordersCollection.find().sort({ timestamp: -1 }).toArray();
    return orders.map(order => mapId<Order>(order));
}

export async function createOrder(orderData: Omit<Order, 'id' | 'timestamp' | 'status'>, tableIdToUpdate: string): Promise<Order> {
    const ordersCollection = await getCollection<Order>('orders');
    const newOrder = {
        ...orderData,
        timestamp: new Date().toISOString(),
        status: 'pending' as OrderStatus,
    };
    const result = await ordersCollection.insertOne(newOrder as Omit<Order, 'id'>);
    
    // Update table status
    if (tableIdToUpdate) {
        await updateTableStatus(tableIdToUpdate, 'occupied', orderData.waiterId);
    }
    
    revalidatePath('/waiter');
    revalidatePath('/manager');
    return mapId<Order>({ ...newOrder, _id: result.insertedId });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const ordersCollection = await getCollection<Order>('orders');
    const tablesCollection = await getCollection<Table>('tables');

    await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status } }
    );
    
    if (status === 'served') {
        const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
        if (order) {
            const table = await tablesCollection.findOne({ tableNumber: order.tableNumber });
            if (table) {
                // Check if there are other non-served orders for this table by the same waiter
                const otherOrders = await ordersCollection.countDocuments({
                    tableNumber: table.tableNumber,
                    waiterId: order.waiterId,
                    status: { $ne: 'served' },
                });

                if (otherOrders === 0) {
                   await tablesCollection.updateOne(
                       { _id: table._id },
                       { $set: { status: 'available', waiterId: null }}
                   );
                }
            }
        }
    }

    revalidatePath('/waiter');
    revalidatePath('/manager');
}

// Menu Item Actions
export async function getMenuItems(): Promise<MenuItem[]> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    const menuItems = await menuItemsCollection.find().toArray();
    return menuItems.map(item => mapId<MenuItem>(item));
}

export async function addMenuItem(itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    const result = await menuItemsCollection.insertOne(itemData);
    revalidatePath('/manager');
    return mapId<MenuItem>({ ...itemData, _id: result.insertedId });
}

export async function updateMenuItem(updatedItem: MenuItem): Promise<void> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    const { id, ...dataToUpdate } = updatedItem;
    await menuItemsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
    );
    revalidatePath('/manager');
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    await menuItemsCollection.deleteOne({ _id: new ObjectId(itemId) });
    revalidatePath('/manager');
}

// Waiter Actions
export async function getWaiters(): Promise<Waiter[]> {
    const waitersCollection = await getCollection<Waiter>('waiters');
    const waiters = await waitersCollection.find().toArray();
    return waiters.map(waiter => mapId<Waiter>(waiter));
}
