
'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { initialMenuItems, initialOrders, initialWaiters, initialTables, initialUsers } from '@/lib/mock-data';
import type { MenuItem, Order, OrderStatus, Waiter, Table, User, UserStatus, OrderItem, Bill, BillStatus, ReportData, OrderReport } from '@/lib/types';
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
    if (count === 0 && data.length > 0) {
        // We are dropping the ID from the mock data, and letting Mongo create it
        const documents = data.map(({ id, ...rest }) => rest);
        if (documents.length > 0) {
           await collection.insertMany(documents as any[]);
        }
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

// A helper function to check if a table should be marked as available
async function freeUpTableIfNeeded(tableNumber: number, waiterId: string) {
    const ordersCollection = await getCollection<Order>('orders');
    const tablesCollection = await getCollection<Table>('tables');
    
    const table = await tablesCollection.findOne({ tableNumber });
    if (table) {
        // Check if there are any other active orders for this table by the same waiter
        const otherOrdersCount = await ordersCollection.countDocuments({
            tableNumber: table.tableNumber,
            waiterId: waiterId,
            status: { $nin: ['served', 'cancelled', 'billed'] },
        });

        if (otherOrdersCount === 0) {
           await tablesCollection.updateOne(
               { _id: table._id },
               { $set: { status: 'available', waiterId: null }}
           );
        }
    }
}


// Order Actions
export async function getOrders(): Promise<Order[]> {
    const ordersCollection = await getCollection<Order>('orders');
    const orders = await ordersCollection.find().sort({ timestamp: -1 }).toArray();
    return orders.map(order => mapId<Order>(order));
}

export async function createOrder(orderData: Omit<Order, 'id' | 'timestamp' | 'status' | 'items'> & { items: Omit<OrderItem, 'price'>[] }, tableIdToUpdate: string): Promise<Order> {
    const ordersCollection = await getCollection<Order>('orders');
    const menuItemsCollection = await getCollection<MenuItem>('menu');

    const itemsWithPrices: OrderItem[] = await Promise.all(
        orderData.items.map(async (item) => {
            const menuItem = await menuItemsCollection.findOne({ _id: new ObjectId(item.menuItemId) });
            if (!menuItem) {
                throw new Error(`Menu item with id ${item.menuItemId} not found`);
            }
            return {
                ...item,
                price: menuItem.price
            };
        })
    );

    const newOrder = {
        ...orderData,
        items: itemsWithPrices,
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

export async function updateOrder(orderId: string, itemsData: Omit<OrderItem, 'price'>[]): Promise<Order> {
    const ordersCollection = await getCollection<Order>('orders');
    const menuItemsCollection = await getCollection<MenuItem>('menu');

    const itemsWithPrices: OrderItem[] = await Promise.all(
        itemsData.map(async (item) => {
            const menuItem = await menuItemsCollection.findOne({ _id: new ObjectId(item.menuItemId) });
            if (!menuItem) throw new Error(`Menu item with id ${item.menuItemId} not found`);
            return { ...item, price: menuItem.price };
        })
    );

    await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { items: itemsWithPrices } }
    );
    
    revalidatePath('/waiter');
    revalidatePath('/manager');
    const updatedOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    return mapId<Order>(updatedOrder);
}


export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const ordersCollection = await getCollection<Order>('orders');
    
    await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status } }
    );
    
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (order && status === 'served') {
       await freeUpTableIfNeeded(order.tableNumber, order.waiterId);
    }

    revalidatePath('/waiter');
    revalidatePath('/manager');
    revalidatePath('/kitchen');
}

export async function deleteOrder(orderId: string): Promise<void> {
    const ordersCollection = await getCollection<Order>('orders');
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (order) {
        await ordersCollection.deleteOne({ _id: new ObjectId(orderId) });
        await freeUpTableIfNeeded(order.tableNumber, order.waiterId);
    }
    revalidatePath('/waiter');
    revalidatePath('/manager');
}


export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    const ordersCollection = await getCollection<Order>('orders');
    
    await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: 'cancelled', cancellationReason: reason } }
    );
    
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (order) {
       await freeUpTableIfNeeded(order.tableNumber, order.waiterId);
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

// Bill Actions
export async function getBills(): Promise<Bill[]> {
    const billsCollection = await getCollection<Bill>('bills');
    const bills = await billsCollection.find().sort({ timestamp: -1 }).toArray();
    return bills.map(bill => mapId<Bill>(bill));
}

export async function createBillForTable(tableNumber: number, waiterId: string): Promise<Bill> {
    const ordersCollection = await getCollection<Order>('orders');
    const billsCollection = await getCollection<Bill>('bills');
    
    const ordersToBill = await ordersCollection.find({
        tableNumber,
        waiterId,
        status: 'served'
    }).toArray();

    if (ordersToBill.length === 0) {
        throw new Error("No served orders found for this table to bill.");
    }

    const subtotal = ordersToBill.reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        return sum + orderTotal;
    }, 0);

    const TAX_RATE = 0.10; // 10% tax
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const newBill: Omit<Bill, 'id'> = {
        tableNumber,
        orderIds: ordersToBill.map(o => o._id.toHexString()),
        waiterId,
        subtotal,
        tax,
        total,
        status: 'unpaid',
        timestamp: new Date().toISOString(),
    };

    const result = await billsCollection.insertOne(newBill);
    const newBillId = result.insertedId;

    // Update orders to 'billed' status
    await ordersCollection.updateMany(
        { _id: { $in: ordersToBill.map(o => o._id) } },
        { $set: { status: 'billed' } }
    );

    revalidatePath('/waiter');
    return mapId<Bill>({ ...newBill, _id: newBillId });
}

export async function markBillAsPaid(billId: string): Promise<void> {
    const billsCollection = await getCollection<Bill>('bills');
    const tablesCollection = await getCollection<Table>('tables');

    await billsCollection.updateOne(
        { _id: new ObjectId(billId) },
        { $set: { status: 'paid' } }
    );

    const bill = await billsCollection.findOne({ _id: new ObjectId(billId) });
    if (bill) {
        await tablesCollection.updateOne(
            { tableNumber: bill.tableNumber },
            { $set: { status: 'available', waiterId: null } }
        );
    }
    
    revalidatePath('/waiter');
    revalidatePath('/admin');
}

// Report Actions
export async function getReportData(startDate: string, endDate: string): Promise<ReportData> {
    const [orders, bills, users, menuItems, waiters] = await Promise.all([
        getOrders(),
        getBills(),
        getUsers(),
        getMenuItems(),
        getWaiters(),
    ]);

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure end of day is included

    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.timestamp);
        return orderDate >= start && orderDate <= end;
    });

    const filteredBills = bills.filter(b => {
        const billDate = new Date(b.timestamp);
        return billDate >= start && billDate <= end;
    });

    // Calculate overall stats from filtered data
    const servedOrders = filteredOrders.filter(o => o.status === 'served');
    const totalRevenue = servedOrders.reduce((total, order) => 
        total + order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), 0);

    const totalOrders = filteredOrders.length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
    
    // Sanitize user data (remove passwords)
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    
    // Create name maps for easier lookup
    const waiterNameMap = new Map(waiters.map(w => [w.id, w.name]));
    const menuItemNameMap = new Map(menuItems.map(m => [m.id, m.name]));

    const transformedOrders: OrderReport[] = filteredOrders.map(order => {
        return {
            ...order,
            waiterName: waiterNameMap.get(order.waiterId) || 'Unknown Waiter',
            items: order.items.map(item => ({
                ...item,
                itemName: menuItemNameMap.get(item.menuItemId) || 'Unknown Item',
            }))
        }
    });

    return {
        reportPeriod: {
            start: startDate,
            end: endDate,
        },
        summary: {
            totalRevenue,
            totalOrders,
            servedOrders: servedOrders.length,
            cancelledOrders,
            totalBills: filteredBills.length,
            totalUsers: users.length,
            totalMenuItems: menuItems.length,
        },
        data: {
            orders: transformedOrders,
            bills,
            users: sanitizedUsers,
            menuItems,
            waiters,
        }
    }
}
