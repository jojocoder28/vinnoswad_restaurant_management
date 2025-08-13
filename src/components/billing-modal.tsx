
"use client";

import type { Bill, Order, MenuItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, AlertTriangle } from 'lucide-react';
import QRCode from "react-qr-code";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
    onPayBill: (billId: string) => void;
    orders: Order[];
    menuItems: MenuItem[];
}

// Configuration: Replace with your actual UPI ID and recipient name.
const YOUR_UPI_ID = "restaurant@upi";
const YOUR_UPI_NAME = "Vinnoswad Restaurant";

export default function BillingModal({ isOpen, onClose, bill, onPayBill, orders, menuItems }: BillingModalProps) {

    if (!isOpen || !bill) {
        return null;
    }
    
    // This creates a standard UPI intent QR code string.
    const upiString = `upi://pay?pa=${YOUR_UPI_ID}&pn=${encodeURIComponent(YOUR_UPI_NAME)}&am=${bill.total.toFixed(2)}&cu=INR&tn=Bill for Table ${bill.tableNumber}`;
    
    // Consolidate all items from the billed orders for display.
    const allItems = orders.flatMap(order => 
        order.items.map(item => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return {
                ...item,
                name: menuItem?.name || 'Unknown Item'
            };
        })
    );
    
    // Group items by name and sum quantities
    const groupedItems = allItems.reduce((acc, item) => {
        const existing = acc.get(item.name);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            acc.set(item.name, { ...item });
        }
        return acc;
    }, new Map<string, typeof allItems[0]>());
    
    const finalItems = Array.from(groupedItems.values());

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Bill for Table {bill.tableNumber}</DialogTitle>
                    <DialogDescription>
                        Present this to the customer for UPI payment.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 flex flex-col items-center justify-center gap-4 bg-white p-4 rounded-lg">
                    <QRCode value={upiString} size={256} />
                    <p className="text-sm text-muted-foreground">Scan to pay: <span className="font-semibold text-primary">₹{bill.total.toFixed(2)}</span></p>
                </div>
                
                <Separator />
                
                <div className="text-sm space-y-1 my-4">
                     <h4 className="font-semibold mb-2">Order Summary:</h4>
                     {finalItems.map((item, index) => (
                        <div key={`${item.menuItemId}-${index}`} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                     ))}
                </div>

                <Separator />
                
                <div className="space-y-1 my-4 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Tax (10%)</span>
                        <span className="font-mono">₹{bill.tax.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="font-mono">₹{bill.total.toFixed(2)}</span>
                    </div>
                </div>

                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 [&>svg]:text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Manual Confirmation Required</AlertTitle>
                    <AlertDescription>
                        After the customer has paid, click the button below to confirm and close the table.
                    </AlertDescription>
                </Alert>


                <DialogFooter className="mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                    <Button type="button" onClick={() => onPayBill(bill.id)}>
                        <Check className="mr-2 h-4 w-4"/>
                        Confirm Payment Received
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
