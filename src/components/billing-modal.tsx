
"use client";

import type { Bill, Order, MenuItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';
import QRCode from "react-qr-code";


interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
    onPayBill: (billId: string) => void;
    orders: Order[];
    menuItems: MenuItem[];
}

export default function BillingModal({ isOpen, onClose, bill, onPayBill, orders, menuItems }: BillingModalProps) {
    const YOUR_UPI_ID = "dasjojo7-1@okicici";

    if (!isOpen || !bill) {
        return null;
    }
    
    const upiString = `upi://pay?pa=${YOUR_UPI_ID}&pn=Vinnoswad&am=${bill.total.toFixed(2)}&cu=INR&tn=Bill for Table ${bill.tableNumber}`;
    const allItems = orders.flatMap(order => order.items);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Bill for Table {bill.tableNumber}</DialogTitle>
                    <DialogDescription>
                        Scan the QR code to pay using any UPI app.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 flex flex-col items-center justify-center gap-4 bg-white p-4 rounded-lg">
                    <QRCode value={upiString} size={256} />
                    <p className="text-sm text-muted-foreground">Or pay to UPI ID: <span className="font-semibold text-primary">{YOUR_UPI_ID}</span></p>
                </div>
                
                <Separator />
                
                <div className="text-sm space-y-1 my-4">
                     <h4 className="font-semibold mb-2">Order Summary:</h4>
                     {allItems.map((item, index) => {
                        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                        return (
                            <div key={`${item.menuItemId}-${index}`} className="flex justify-between">
                                <span>{item.quantity}x {menuItem?.name || 'Unknown Item'}</span>
                                <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        )
                     })}
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

                <DialogFooter className="mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                    <Button type="button" onClick={() => onPayBill(bill.id)}>
                        <Check className="mr-2 h-4 w-4"/>
                        Confirm & Mark as Paid
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
