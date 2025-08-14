
"use client";

import type { Bill, Order, MenuItem, DecodedToken, RazorpayOrder } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, IndianRupee, Loader2, Printer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useState, useEffect } from 'react';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import QRCode from "react-qr-code";
import Logo from './logo';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

declare const Razorpay: any;

// Fallback UPI ID if Razorpay is not configured. Loaded from environment variables.
const FALLBACK_UPI_ID = process.env.NEXT_PUBLIC_FALLBACK_UPI_ID || "dasjojo7-1@okicici";


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
    const [isPaid, setIsPaid] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    // Check if Razorpay is configured
    const isRazorpayConfigured = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // Reset paid state when a new bill is opened
    useEffect(() => {
        if (bill) {
            setIsPaid(bill.status === 'paid');
        }
    }, [bill]);

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

    const handleSuccessfulPayment = () => {
        if (!bill) return;
        onPayBill(bill.id);
        setIsPaid(true);
        setLoading(false);
    };

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
                        
                        toast({ title: "Payment Successful!", description: "The bill has been marked as paid." });
                        handleSuccessfulPayment();

                    } catch (verifyError) {
                         const errorMessage = verifyError instanceof Error ? verifyError.message : "Payment verification failed.";
                         toast({ title: "Verification Failed", description: errorMessage, variant: "destructive" });
                         setLoading(false);
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
                    color: "#59331d", // Matches the app's primary color (dark brown)
                },
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast({
                    title: "Payment Failed",
                    description: response.error.description || "The payment could not be completed.",
                    variant: "destructive"
                });
                setLoading(false);
            });
            rzp.open();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Payment Error",
                description: errorMessage,
                variant: "destructive"
            });
            setLoading(false);
        }
    }
    
    const handleManualPayment = () => {
        if (!bill) return;
        setLoading(true);
        handleSuccessfulPayment();
    }
    
    const handlePrint = () => {
        const printContent = document.getElementById('printable-bill');
        if (printContent) {
            const newWindow = window.open('', '', 'height=800,width=800');
            if (newWindow) {
                newWindow.document.write('<html><head><title>Print Bill</title>');
                const styles = `<style>
                    body { font-family: sans-serif; margin: 20px; color: #333; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 4px; text-align: left; vertical-align: top; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-mono { font-family: monospace; }
                    .font-bold { font-weight: bold; }
                    .text-sm { font-size: 0.875rem; }
                    .text-xs { font-size: 0.75rem; }
                    .mt-2 { margin-top: 0.5rem; }
                    .mt-4 { margin-top: 1rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .items-center { align-items: center; }
                    .gap-2 { gap: 0.5rem; }
                    .justify-between { justify-content: space-between; }
                    .relative { position: relative; }
                    .break-all { word-wrap: break-word; }
                </style>`;
                newWindow.document.write(styles);
                newWindow.document.write('</head><body>');
                newWindow.document.write(printContent.innerHTML);
                newWindow.document.write('</body></html>');
                newWindow.document.close();
                newWindow.onload = () => {
                    newWindow.print();
                    newWindow.close();
                };
            }
        }
    };

    if (!isOpen || !bill) {
        return null;
    }

    const upiUri = `upi://pay?pa=${FALLBACK_UPI_ID}&pn=Vinnoswad&am=${bill.total.toFixed(2)}&cu=INR&tn=Bill for Table ${bill.tableNumber}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                 {/* This is the hidden, styled-for-print div */}
                <div id="printable-bill" className="hidden">
                    <div className="relative">
                        {isPaid && (
                           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-12deg)', zIndex: 10, opacity: 0.1 }}>
                                <span style={{ fontSize: '6rem', fontWeight: 'bold', color: 'hsl(var(--primary))', border: '8px solid hsl(var(--primary))', borderRadius: '0.5rem', padding: '1rem 2rem' }}>
                                    PAID
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col items-center text-center">
                            <h2 style={{fontWeight: 'bold', fontSize: '1.25rem', marginTop: '0.5rem' }}>Vinnoswad Restaurant</h2>
                            <p className="text-sm">117-NH, Sarisha Ashram More, Diamond Harbour</p>
                            <p className="text-sm">South 24 Parganas, PIN - 743368, WB, INDIA</p>
                            <p className="text-sm">GSTIN: 29GGGGG1314G1Z4</p>
                        </div>
                        <div style={{borderBottom: '1px dashed black', margin: '1rem 0'}} />
                        <div className="text-xs">
                            <p><strong>Bill No:</strong> {bill.id.slice(-6)}</p>
                            <p><strong>Table:</strong> {bill.tableNumber}</p>
                            <p><strong>Date:</strong> {format(new Date(bill.timestamp), "dd-MMM-yyyy hh:mm a")}</p>
                        </div>
                        <div style={{borderBottom: '1px dashed black', margin: '1rem 0'}} />
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{borderBottom: '1px dashed black'}}>
                                    <th className="text-left pb-2 font-bold">Item</th>
                                    <th className="text-center pb-2 font-bold">Qty</th>
                                    <th className="text-right pb-2 font-bold">Price</th>
                                    <th className="text-right pb-2 font-bold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalItems.map((item, index) => (
                                    <tr key={`${item.menuItemId}-${index}`}>
                                        <td className="pt-2 break-all" style={{width: '50%'}}>{item.name}</td>
                                        <td className="text-center pt-2">{item.quantity}</td>
                                        <td className="text-right pt-2 font-mono">{(item.price).toFixed(2)}</td>
                                        <td className="text-right pt-2 font-mono">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{borderBottom: '1px dashed black', margin: '1rem 0'}} />
                        <div className="text-sm" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold" style={{fontSize: '1rem', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed black'}}>
                                <span>Grand Total</span>
                                <span className="font-mono">₹{bill.total.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {!isPaid && (
                             <div className="flex flex-col items-center gap-2 mt-4">
                                <hr style={{width: '100%', borderBottom: '1px dashed black', margin: '1rem 0'}} />
                                <p className="text-xs font-bold">Scan to Pay</p>
                                <div style={{background: 'white', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ccc'}}>
                                    <QRCode value={upiUri} size={100} />
                                </div>
                            </div>
                        )}
                        <p className="text-center text-xs mt-4">Thank you for dining with us!</p>
                        <p className="text-center text-xs mt-2">Amounts are inclusive of all taxes.</p>
                    </div>
                </div>

                <div className="no-print">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Bill for Table {bill.tableNumber}</DialogTitle>
                        <DialogDescription>
                            Review the bill and proceed to payment or print the receipt.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative">
                        {isPaid && (
                             <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="text-5xl sm:text-8xl font-bold text-primary/10 border-4 border-primary/20 rounded-lg p-4 sm:p-8 transform -rotate-12">
                                    PAID
                                </span>
                            </div>
                        )}
                        <div className={cn("space-y-4 my-4", isPaid && "opacity-50")}>
                            <Separator />
                            <div className="text-sm space-y-2">
                                <h4 className="font-semibold mb-2">Order Summary:</h4>
                                {finalItems.map((item, index) => (
                                    <div key={`${item.menuItemId}-${index}`} className="flex justify-between items-start">
                                        <span className="break-all pr-2">{item.quantity}x {item.name}</span>
                                        <span className="font-mono text-right flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base mt-1">
                                    <span>Total</span>
                                    <span className="font-mono">₹{bill.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {!isPaid && (
                        <>
                            {isRazorpayConfigured ? (
                                <div className="mt-6">
                                     <Button type="button" onClick={handleRazorpayPayment} disabled={loading} className="w-full">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4"/>}
                                        {loading ? 'Processing...' : 'Pay with Razorpay'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 my-6">
                                    <Alert>
                                        <AlertTitle>Pay with any UPI App</AlertTitle>
                                        <AlertDescription>
                                            Scan the QR code with your phone to pay the bill amount.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="bg-white p-2 sm:p-4 rounded-md">
                                        <QRCode value={upiUri} size={isMobile ? 150 : 200} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <DialogFooter className="mt-6 flex-col sm:flex-row sm:justify-between gap-2">
                        <Button type="button" variant="outline" onClick={handlePrint} disabled={loading}>
                            <Printer className="mr-2 h-4 w-4"/> {isPaid ? 'Print Paid Receipt' : 'Print Bill'}
                        </Button>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            {!isRazorpayConfigured && !isPaid && (
                                <Button type="button" onClick={handleManualPayment} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4"/>}
                                    {loading ? 'Confirming...' : 'Confirm Payment'}
                                </Button>
                            )}
                             <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Close</Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
