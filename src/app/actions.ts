
'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import type { MenuItem, Order, OrderStatus, Waiter, Table, User, UserStatus, OrderItem, Bill, BillStatus, ReportData, OrderReport, Supplier, StockItem, PurchaseOrder, PurchaseStatus, RazorpayOrder, StockUsageLog } from '@/lib/types';
import { Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { encrypt, getSession } from '@/lib/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';


async function getCollection<T extends { id?: string }>(collectionName: string): Promise<Collection<Omit<T, 'id'>>> {
    const { db } = await connectToDatabase();
    return db.collection<Omit<T, 'id'>>(collectionName);
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
    
    // All self-registered users start as pending. Only an admin can create an approved user.
    const status: UserStatus = isAdminCreating ? 'approved' : 'pending';
    
    const newUser = {
        ...userData,
        password: hashedPassword,
        status: status,
    };
    
    const result = await usersCollection.insertOne(newUser as Omit<User, 'id'>);
    const newUserId = result.insertedId.toHexString();

    // If an admin creates an approved waiter, add them to the waiters collection immediately.
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
async function freeUpTableIfNeeded(tableNumber: number) {
    const ordersCollection = await getCollection<Order>('orders');
    const tablesCollection = await getCollection<Table>('tables');
    
    const table = await tablesCollection.findOne({ tableNumber });
    if (table) {
        // Check if there are any other active orders for this table by the same waiter
        const otherOrdersCount = await ordersCollection.countDocuments({
            tableNumber: table.tableNumber,
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
    if (order && (status === 'served' || status === 'cancelled')) {
       await freeUpTableIfNeeded(order.tableNumber);
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
        await freeUpTableIfNeeded(order.tableNumber);
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
       await freeUpTableIfNeeded(order.tableNumber);
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
    revalidatePath('/admin');
    return mapId<MenuItem>({ ...itemData, _id: result.insertedId });
}

export async function updateMenuItem(updatedItem: MenuItem): Promise<void> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    const stockItemsCollection = await getCollection<StockItem>('stock');
    const { id, ...dataToUpdate } = updatedItem;

    // Recalculate cost of goods if ingredients are present
    let costOfGoods = 0;
    if (dataToUpdate.ingredients && dataToUpdate.ingredients.length > 0) {
        const stockItemIds = dataToUpdate.ingredients.map(i => new ObjectId(i.stockItemId));
        const stockItems = await stockItemsCollection.find({ _id: { $in: stockItemIds } }).toArray();
        const stockItemMap = new Map(stockItems.map(si => [si._id.toHexString(), si]));

        costOfGoods = dataToUpdate.ingredients.reduce((total, ing) => {
            const stockItem = stockItemMap.get(ing.stockItemId);
            if (stockItem) {
                return total + (stockItem.averageCostPerUnit * ing.quantity);
            }
            return total;
        }, 0);
    }
    dataToUpdate.costOfGoods = costOfGoods;

    await menuItemsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
    );
    revalidatePath('/manager');
    revalidatePath('/admin');
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    const menuItemsCollection = await getCollection<MenuItem>('menu');
    await menuItemsCollection.deleteOne({ _id: new ObjectId(itemId) });
    revalidatePath('/manager');
    revalidatePath('/admin');
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

export async function createBillForTable(tableNumber: number): Promise<Bill> {
    const ordersCollection = await getCollection<Order>('orders');
    const billsCollection = await getCollection<Bill>('bills');
    
    const ordersToBill = await ordersCollection.find({
        tableNumber,
        status: 'served'
    }).toArray();

    if (ordersToBill.length === 0) {
        throw new Error("No served orders found for this table to bill.");
    }

    const subtotal = ordersToBill.reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        return sum + orderTotal;
    }, 0);

    const tax = 0; // Tax is now included in the price
    const total = subtotal; // Total is just the subtotal

    const newBill: Omit<Bill, 'id'> = {
        tableNumber,
        orderIds: ordersToBill.map(o => o._id.toHexString()),
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
    revalidatePath('/manager');
    return mapId<Bill>({ ...newBill, _id: newBillId });
}

export async function markBillAsPaid(billId: string): Promise<void> {
    const billsCollection = await getCollection<Bill>('bills');
    const tablesCollection = await getCollection<Table>('tables');
    const ordersCollection = await getCollection<Order>('orders');
    const stockCollection = await getCollection<StockItem>('stock');
    const menuCollection = await getCollection<MenuItem>('menu');

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
        
        // Auto-deplete stock based on sold items
        const billedOrders = await ordersCollection.find({ _id: { $in: bill.orderIds.map(id => new ObjectId(id)) }}).toArray();
        for (const order of billedOrders) {
            for (const item of order.items) {
                const menuItem = await menuCollection.findOne({ _id: new ObjectId(item.menuItemId) });
                if (menuItem && menuItem.ingredients) {
                    for (const ingredient of menuItem.ingredients) {
                        await stockCollection.updateOne(
                            { _id: new ObjectId(ingredient.stockItemId) },
                            { $inc: { quantityInStock: - (ingredient.quantity * item.quantity) } }
                        );
                    }
                }
            }
        }
    }
    
    revalidatePath('/waiter');
    revalidatePath('/manager');
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
    const servedOrders = filteredOrders.filter(o => o.status === 'served' || o.status === 'billed');
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

// Supply Chain Actions

// Suppliers
export async function getSuppliers(): Promise<Supplier[]> {
    const collection = await getCollection<Supplier>('suppliers');
    const suppliers = await collection.find().toArray();
    return suppliers.map(mapId);
}

export async function addSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const collection = await getCollection<Supplier>('suppliers');
    const result = await collection.insertOne(data);
    revalidatePath('/admin');
    return mapId({ ...data, _id: result.insertedId });
}

export async function updateSupplier(data: Supplier): Promise<void> {
    const collection = await getCollection<Supplier>('suppliers');
    const { id, ...updateData } = data;
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    revalidatePath('/admin');
}

export async function deleteSupplier(id: string): Promise<void> {
    const collection = await getCollection<Supplier>('suppliers');
    await collection.deleteOne({ _id: new ObjectId(id) });
    revalidatePath('/admin');
}

// Stock Items
export async function getStockItems(): Promise<StockItem[]> {
    const collection = await getCollection<StockItem>('stock');
    const items = await collection.find().toArray();
    return items.map(mapId);
}

export async function addStockItem(data: Omit<StockItem, 'id'>): Promise<StockItem> {
    const collection = await getCollection<StockItem>('stock');
    const result = await collection.insertOne(data);
    revalidatePath('/admin');
    return mapId({ ...data, _id: result.insertedId });
}

export async function updateStockItem(data: StockItem): Promise<void> {
    const collection = await getCollection<StockItem>('stock');
    const { id, ...updateData } = data;
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    revalidatePath('/admin');
}

export async function deleteStockItem(id: string): Promise<void> {
    const collection = await getCollection<StockItem>('stock');
    await collection.deleteOne({ _id: new ObjectId(id) });
    revalidatePath('/admin');
}

// Stock Usage Logs
export async function getStockUsageLogs(): Promise<StockUsageLog[]> {
    const collection = await getCollection<StockUsageLog>('stock_usage_logs');
    const logs = await collection.find().sort({ timestamp: -1 }).toArray();
    return logs.map(mapId);
}

export async function recordStockUsage(data: Omit<StockUsageLog, 'id' | 'timestamp'>): Promise<StockUsageLog> {
    const usageCollection = await getCollection<StockUsageLog>('stock_usage_logs');
    const stockCollection = await getCollection<StockItem>('stock');

    const logEntry = {
        ...data,
        timestamp: new Date().toISOString()
    };

    // 1. Record the usage event
    const result = await usageCollection.insertOne(logEntry as Omit<StockUsageLog, 'id'>);

    // 2. Decrement the stock quantity
    await stockCollection.updateOne(
        { _id: new ObjectId(data.stockItemId) },
        { $inc: { quantityInStock: -data.quantityUsed } }
    );
    
    revalidatePath('/manager');
    revalidatePath('/admin');
    return mapId({ ...logEntry, _id: result.insertedId });
}


// Purchase Orders
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const collection = await getCollection<PurchaseOrder>('purchase_orders');
    const orders = await collection.find().sort({ date: -1 }).toArray();
    return orders.map(mapId);
}

export async function addPurchaseOrder(data: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    const collection = await getCollection<PurchaseOrder>('purchase_orders');
    const result = await collection.insertOne(data);
    revalidatePath('/admin');
    return mapId({ ...data, _id: result.insertedId });
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseStatus): Promise<void> {
    const poCollection = await getCollection<PurchaseOrder>('purchase_orders');
    
    await poCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    if (status === 'received') {
        const purchaseOrder = await poCollection.findOne({ _id: new ObjectId(id) });
        if (purchaseOrder) {
            const stockCollection = await getCollection<StockItem>('stock');
            // This is a complex operation, ideally done in a transaction
            for (const item of purchaseOrder.items) {
                const stockItem = await stockCollection.findOne({ _id: new ObjectId(item.stockItemId) });
                if (stockItem) {
                    const currentStockValue = stockItem.quantityInStock * stockItem.averageCostPerUnit;
                    const purchaseValue = item.quantity * item.costPerUnit;
                    
                    const newTotalQuantity = stockItem.quantityInStock + item.quantity;
                    const newAverageCost = (currentStockValue + purchaseValue) / newTotalQuantity;

                    await stockCollection.updateOne(
                        { _id: new ObjectId(item.stockItemId) },
                        { 
                            $inc: { quantityInStock: item.quantity },
                            $set: { averageCostPerUnit: newAverageCost }
                        }
                    );
                }
            }
        }
    }
    revalidatePath('/admin');
}


// Payment Gateway Actions

export async function createRazorpayOrder(amount: number, receiptId: string): Promise<RazorpayOrder> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay API keys are not configured on the server.");
    }
    
    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
    
    const options = {
        amount: amount * 100, // Amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: receiptId,
    };
    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        throw new Error("Failed to create payment order.");
    }
}

export async function verifyRazorpayPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}): Promise<void> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
     if (!keySecret) {
        throw new Error("Razorpay secret key is not configured for verification.");
    }

    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        throw new Error("Invalid payment signature.");
    }
    
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
        throw new Error("Razorpay key ID is not configured for fetching order.");
    }

    // Re-initialize to fetch order details
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    
    // The payment is authentic. Now, fetch the order from the database
    // using the receiptId which we stored as the razorpay_order_id's `receipt`.
    const orderInfo = await razorpay.orders.fetch(razorpay_order_id);
    const billId = orderInfo.receipt;
    
    if (!billId) {
        throw new Error("Bill ID not found in Razorpay order.");
    }

    // Mark the bill as paid in the database
    await markBillAsPaid(billId);
}
