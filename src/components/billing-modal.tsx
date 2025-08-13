
"use client";

import type { Bill, Order, MenuItem, DecodedToken, RazorpayOrder } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, IndianRupee, Loader2, Printer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useState } from 'react';
import { createRazorpayOrder, verifyRazorpayPayment, markBillAsPaid } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import QRCode from "react-qr-code";
import Logo from './logo';
import { format } from 'date-fns';

declare const Razorpay: any;

// Fallback UPI ID if Razorpay is not configured. Loaded from environment variables.
const FALLBACK_UPI_ID = process.env.NEXT_PUBLIC_FALLBACK_UPI_ID || "your-upi-id@example";


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
    
    // Check if Razorpay is configured
    const isRazorpayConfigured = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

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

    const handleRazorpayPayment = async () => {
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
                        
                        // 4. If verification is successful, onPayBill is called automatically by the server action
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
            rzp.on('payment.failed', function (response: any) {
                toast({
                    title: "Payment Failed",
                    description: response.error.description || "The payment could not be completed.",
                    variant: "destructive"
                });
            });
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
    
    const handleManualPayment = () => {
        if (!bill) return;
        setLoading(true);
        onPayBill(bill.id);
        setLoading(false);
    }
    
    const handlePrint = () => {
        window.print();
    }


    if (!isOpen || !bill) {
        return null;
    }

    const upiUri = `upi://pay?pa=${FALLBACK_UPI_ID}&pn=Vinnoswad&am=${bill.total.toFixed(2)}&cu=INR&tn=Bill for Table ${bill.tableNumber}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md print:max-w-none print:border-none print:shadow-none">
                 <div id="printable-bill" className="hidden print:block text-black">
                    <div className="flex flex-col items-center text-center">
                        <Logo className="w-16 h-16"/>
                        <h2 className="font-bold text-xl mt-2">Vinnoswad Restaurant</h2>
                        <p className="text-sm">123 Culinary Lane, Foodie City, 12345</p>
                        <p className="text-sm">GSTIN: 29GGGGG1314G1Z4</p>
                    </div>
                    <Separator className="my-4 border-dashed border-black" />
                    <div className="text-xs">
                        <p><strong>Bill No:</strong> {bill.id.slice(-6)}</p>
                        <p><strong>Table:</strong> {bill.tableNumber}</p>
                        <p><strong>Date:</strong> {format(new Date(bill.timestamp), "dd-MMM-yyyy hh:mm a")}</p>
                    </div>
                     <Separator className="my-4 border-dashed border-black" />
                     <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-dashed border-black">
                                <th className="text-left pb-2 font-semibold">Item</th>
                                <th className="text-center pb-2 font-semibold">Qty</th>
                                <th className="text-right pb-2 font-semibold">Price</th>
                                <th className="text-right pb-2 font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finalItems.map((item, index) => (
                                <tr key={`${item.menuItemId}-${index}`}>
                                    <td className="pt-2" style={{ wordBreak: 'break-word' }}>{item.name}</td>
                                    <td className="text-center pt-2">{item.quantity}</td>
                                    <td className="text-right pt-2 font-mono">{(item.price).toFixed(2)}</td>
                                    <td className="text-right pt-2 font-mono">{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                     <Separator className="my-4 border-dashed border-black" />
                     <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (10%)</span>
                            <span className="font-mono">₹{bill.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base mt-1">
                            <span>Grand Total</span>
                            <span className="font-mono">₹{bill.total.toFixed(2)}</span>
                        </div>
                     </div>
                     <Separator className="my-4 border-dashed border-black" />
                     <p className="text-center text-xs mt-4">Thank you for dining with us!</p>
                </div>

                <div className="no-print">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Bill for Table {bill.tableNumber}</DialogTitle>
                        <DialogDescription>
                            Review the bill and proceed to payment or print the receipt.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-sm space-y-2 my-4">
                        <h4 className="font-semibold mb-2">Order Summary:</h4>
                        {finalItems.map((item, index) => (
                            <div key={`${item.menuItemId}-${index}`} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-4"/>
                    
                    <div className="space-y-2 my-4 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (10%)</span>
                            <span className="font-mono">₹{bill.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base mt-1">
                            <span>Total</span>
                            <span className="font-mono">₹{bill.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {!isRazorpayConfigured && (
                        <div className="flex flex-col items-center gap-4 my-6">
                            <Alert>
                                <AlertTitle>Pay with any UPI App</AlertTitle>
                                <AlertDescription>
                                    Scan the QR code with your phone to pay the bill amount.
                                </AlertDescription>
                            </Alert>
                            <div className="bg-white p-4 rounded-md">
                                <QRCode value={upiUri} size={200} />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-6 flex-col sm:flex-row sm:justify-between gap-2">
                        <Button type="button" variant="outline" onClick={handlePrint} disabled={loading}>
                            <Printer className="mr-2 h-4 w-4"/> Print Bill
                        </Button>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Close</Button>
                            {isRazorpayConfigured ? (
                                <Button type="button" onClick={handleRazorpayPayment} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4"/>}
                                    {loading ? 'Processing...' : 'Pay with Razorpay'}
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleManualPayment} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4"/>}
                                    {loading ? 'Confirming...' : 'Confirm Cash/Manual Payment'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

    
