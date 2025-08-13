
"use client";

import type { Bill, Order, MenuItem, DecodedToken, RazorpayOrder } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, IndianRupee, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useEffect, useState } from 'react';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

declare const Razorpay: any;

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
    onPayBill: (billId: string) => void;
    orders: Order[];
    menuItems: MenuItem[];
    currentUser: DecodedToken;
}

export default function BillingModal({ isOpen, onClose, bill, onPayBill, orders, menuItems, currentUser }: BillingModalProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

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

    const handlePayment = async () => {
        if (!bill) return;
        setLoading(true);

        try {
            // 1. Create a Razorpay Order on the server
            const razorpayOrder = await createRazorpayOrder(bill.total, bill.id);
            if (!razorpayOrder) {
                throw new Error("Could not create Razorpay order.");
            }

            // 2. Configure and open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Vinnoswad Restaurant",
                description: `Bill for Table ${bill.tableNumber}`,
                order_id: razorpayOrder.id,
                handler: async function (response: any) {
                    // 3. Verify the payment on the server
                    try {
                        await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        
                        // 4. If verification is successful, mark the bill as paid
                        onPayBill(bill.id);
                        toast({ title: "Payment Successful!", description: "The bill has been marked as paid." });
                        onClose();

                    } catch (verifyError) {
                         const errorMessage = verifyError instanceof Error ? verifyError.message : "Payment verification failed.";
                         toast({ title: "Verification Failed", description: errorMessage, variant: "destructive" });
                    }
                },
                prefill: {
                    name: "Customer",
                    email: "customer@example.com",
                    contact: "9999999999",
                },
                notes: {
                    billId: bill.id,
                    tableNumber: bill.tableNumber,
                },
                theme: {
                    color: "#008080", // Matches the app's primary color
                },
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Payment Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !bill) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Bill for Table {bill.tableNumber}</DialogTitle>
                    <DialogDescription>
                        Review the bill and proceed to payment.
                    </DialogDescription>
                </DialogHeader>
                
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

                <DialogFooter className="mt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Close</Button>
                    <Button type="button" onClick={handlePayment} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4"/>}
                        {loading ? 'Processing...' : 'Pay with Razorpay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
