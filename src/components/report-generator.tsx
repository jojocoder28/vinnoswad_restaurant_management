
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
            
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(reportData, null, 2)
            )}`;
            
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `eateryflow_report_${format(date.from, "yyyy-MM-dd")}_to_${format(date.to, "yyyy-MM-dd")}.json`;
            link.click();
            
            toast({
                title: "Report Generated",
                description: "Your report has been downloaded successfully.",
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
                <CardDescription>Download detailed restaurant data for a specified date range in JSON format.</CardDescription>
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
