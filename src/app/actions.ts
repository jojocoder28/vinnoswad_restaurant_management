
'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { initialMenuItems, initialOrders, initialWaiters, initialTables, initialUsers } from '@/lib/mock-data';
import type { MenuItem, Order, OrderStatus, Waiter, Table, User, UserStatus } from '@/lib/types';
import { Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { encrypt, getSession } from '@/lib/auth';

async function getCollection<T extends { id?: string }>(collectionName: string): Promise<Collection<Omit<T, 'id'>>> {
    const { db } = await connectToDatabase();
    return db.collection<Omit<T, 'id'>>(collectionName);
}

async function seedCollection<T extends { id?: string }>(collectionName: string, data: T[]) {
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
    
    // Seed users and then link waiters to them
    const usersCollection = await getCollection<User>('users');
    const usersCount = await usersCollection.countDocuments();
    if (usersCount === 0) {
        await usersCollection.insertMany(initialUsers as any[]);
        const waitersCollection = await getCollection<Waiter>('waiters');
        const users = await usersCollection.find({ role: 'waiter', status: 'approved' }).toArray();

        const waitersToInsert = users.map(user => ({
            name: user.name,
            userId: user._id.toHexString()
        }));
        if(waitersToInsert.length > 0){
             await waitersCollection.insertMany(waitersToInsert as any[]);
        }
    }
    
    await seedCollection('orders', initialOrders);
    await seedCollection('tables', initialTables);
}

function mapId<T>(document: any): T {
  if (!document) return document;
  const { _id, ...rest } = document;
  return { id: _id.toHexString(), ...rest } as T;
}

// Auth Actions
export async function registerUser(userData: Omit<User, 'id' | 'status'>, isAdminCreating: boolean = false) {
    const usersCollection = await getCollection<User>('users');
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        return { success: false, error: 'User with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    
    let status: UserStatus;
    if (isAdminCreating) {
        status = 'approved';
    } else {
        status = (userData.role === 'manager' || userData.role === 'waiter' || userData.role === 'kitchen') ? 'pending' : 'approved';
    }
    
    const newUser = {
        ...userData,
        password: hashedPassword,
        status: status,
    };
    
    const result = await usersCollection.insertOne(newUser as Omit<User, 'id'>);
    const newUserId = result.insertedId.toHexString();

    if (status === 'approved' && userData.role === 'waiter') {
        const waitersCollection = await getCollection<Waiter>('waiters');
        await waitersCollection.insertOne({
            name: userData.name,
            userId: newUserId,
        } as Omit<Waiter, 'id'>);
    }
    
    if(!isAdminCreating) {
        revalidatePath('/login');
    } else {
        revalidatePath('/admin');
    }

    return { success: true, pending: status === 'pending' };
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const usersCollection = await getCollection<User>('users');
    const user = await usersCollection.findOne({ email });

    if (!user) {
        return { success: false, error: 'Invalid email or password.' };
    }

    if (user.status === 'pending') {
        return { success: false, error: 'Your account is pending approval from an administrator.' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password!);
    if (!passwordsMatch) {
        return { success: false, error: 'Invalid email or password.' };
    }
    
    const mappedUser = mapId<User>(user);
    const { password: _, ...userSessionData } = mappedUser;

    // Create the session
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const session = await encrypt({ user: userSessionData, expires });

    // Save the session in a cookie
    cookies().set('session', session, { expires, httpOnly: true });

    return { success: true, user: mappedUser };
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
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

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const usersCollection = await getCollection<User>('users');
    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { status } }
    );
    
    if (status === 'approved') {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.role === 'waiter') {
             const waitersCollection = await getCollection<Waiter>('waiters');
             await waitersCollection.insertOne({
                name: user.name,
                userId: userId,
             } as Omit<Waiter, 'id'>);
        }
    }

    revalidatePath('/admin');
}

export async function deleteUser(userId: string): Promise<void> {
    const usersCollection = await getCollection<User>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (user && user.role === 'waiter') {
        const waitersCollection = await getCollection<Waiter>('waiters');
        await waitersCollection.deleteOne({ userId: userId });
    }

    await usersCollection.deleteOne({ _id: new ObjectId(userId) });
    revalidatePath('/admin');
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
                    status: { $nin: ['served'] },
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
    revalidatePath('/kitchen');
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
