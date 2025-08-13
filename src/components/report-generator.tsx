
"use client"

import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { getReportData } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { ReportData } from "@/lib/types";


// Helper function to convert an array of objects to a CSV string
function toCSV(data: any[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map(row => {
        return columns.map(col => {
            let value = row[col];
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            const stringValue = String(value);
            // Escape commas and quotes
            if (stringValue.includes('"') || stringValue.includes(',')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

function downloadCSV(csvString: string, filename: string) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export default function ReportGenerator() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!date?.from || !date?.to) {
            toast({
                title: "Invalid Date Range",
                description: "Please select a valid start and end date.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const reportData = await getReportData(format(date.from, "yyyy-MM-dd"), format(date.to, "yyyy-MM-dd"));
            
            const fileSuffix = `${format(date.from, "yyyy-MM-dd")}_to_${format(date.to, "yyyy-MM-dd")}`;

            // Create and download CSVs for each data type
            if (reportData.data.orders.length > 0) {
                // Flatten the items for better CSV readability
                const flatOrders = reportData.data.orders.flatMap(order => 
                    order.items.map(item => ({
                        orderId: order.id,
                        tableNumber: order.tableNumber,
                        waiterName: order.waiterName,
                        status: order.status,
                        timestamp: order.timestamp,
                        cancellationReason: order.cancellationReason || '',
                        itemName: item.itemName,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.price * item.quantity
                    }))
                );
                const ordersCSV = toCSV(flatOrders, ['orderId', 'tableNumber', 'waiterName', 'status', 'timestamp', 'cancellationReason', 'itemName', 'quantity', 'price', 'total']);
                downloadCSV(ordersCSV, `orders_report_${fileSuffix}.csv`);
            }
            if (reportData.data.bills.length > 0) {
                const billsCSV = toCSV(reportData.data.bills, Object.keys(reportData.data.bills[0]));
                downloadCSV(billsCSV, `bills_report_${fileSuffix}.csv`);
            }
            if (reportData.data.users.length > 0) {
                const usersCSV = toCSV(reportData.data.users, Object.keys(reportData.data.users[0]));
                downloadCSV(usersCSV, `users_report_${fileSuffix}.csv`);
            }
            
            // Create a summary CSV
            const summaryData = [{...reportData.summary, ...reportData.reportPeriod}];
            const summaryCSV = toCSV(summaryData, Object.keys(summaryData[0]));
            downloadCSV(summaryCSV, `summary_report_${fileSuffix}.csv`);
            
            toast({
                title: "Report Generated",
                description: "Your report CSV files have been downloaded.",
            });

        } catch (error) {
            console.error("Failed to generate report:", error);
            toast({
                title: "Error",
                description: "Could not generate the report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const setDatePreset = (preset: 'today' | 'this_month' | 'last_30_days') => {
        const today = new Date();
        switch (preset) {
            case 'today':
                setDate({ from: today, to: today });
                break;
            case 'this_month':
                setDate({ from: startOfMonth(today), to: endOfMonth(today) });
                break;
            case 'last_30_days':
                setDate({ from: subDays(today, 29), to: today });
                break;
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Generate Reports</CardTitle>
                <CardDescription>Download detailed restaurant data for a specified date range in CSV format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('this_month')}>This Month</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('last_30_days')}>Last 30 Days</Button>
                    </div>
                </div>
                 <Button onClick={handleDownload} disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Generate & Download Report
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
