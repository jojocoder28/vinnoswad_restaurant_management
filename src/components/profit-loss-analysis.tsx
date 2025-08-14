
"use client";

import type { MenuItem, Order } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndianRupee, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ProfitLossAnalysisProps {
    menuItems: MenuItem[];
    orders: Order[]; // Should be served/billed orders
}

const StatCard = ({ title, value, icon: Icon, helpText, colorClass = 'text-foreground' }: { title: string, value: string, icon: React.ElementType, helpText: string, colorClass?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
            <p className="text-xs text-muted-foreground">{helpText}</p>
        </CardContent>
    </Card>
);

export default function ProfitLossAnalysis({ menuItems, orders }: ProfitLossAnalysisProps) {

    const { totalRevenue, totalCost, totalProfit, profitMargin, itemsSoldMap } = useMemo(() => {
        let revenue = 0;
        let cost = 0;
        const soldMap = new Map<string, number>();

        orders.forEach(order => {
            order.items.forEach(item => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                if (menuItem) {
                    revenue += item.price * item.quantity;
                    cost += (menuItem.costOfGoods || 0) * item.quantity;
                    soldMap.set(item.menuItemId, (soldMap.get(item.menuItemId) || 0) + item.quantity);
                }
            });
        });
        
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return { 
            totalRevenue: revenue, 
            totalCost: cost, 
            totalProfit: profit, 
            profitMargin: margin,
            itemsSoldMap: soldMap
        };

    }, [menuItems, orders]);

    const profitData = useMemo(() => {
        return menuItems.map(item => {
            const sold = itemsSoldMap.get(item.id) || 0;
            const revenue = sold * item.price;
            const cost = sold * (item.costOfGoods || 0);
            const profit = revenue - cost;
            return {
                ...item,
                unitsSold: sold,
                totalRevenue: revenue,
                totalCost: cost,
                totalProfit: profit,
                profitPerUnit: item.price - (item.costOfGoods || 0),
            };
        }).sort((a,b) => b.totalProfit - a.totalProfit);
    }, [menuItems, itemsSoldMap]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profit & Loss Summary</CardTitle>
                    <CardDescription>An overview of the restaurant's financial performance based on served orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            title="Total Revenue" 
                            value={`₹${totalRevenue.toFixed(2)}`} 
                            icon={IndianRupee}
                            helpText="Total money from sales"
                        />
                        <StatCard 
                            title="Total Cost of Goods" 
                            value={`₹${totalCost.toFixed(2)}`} 
                            icon={IndianRupee}
                            helpText="Cost of ingredients for sold items"
                            colorClass="text-amber-600"
                        />
                         <StatCard 
                            title="Gross Profit" 
                            value={`₹${totalProfit.toFixed(2)}`} 
                            icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
                            helpText="Revenue minus cost of goods"
                            colorClass={totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}
                        />
                         <StatCard 
                            title="Profit Margin" 
                            value={`${profitMargin.toFixed(2)}%`} 
                            icon={Minus}
                            helpText="Percentage of revenue that is profit"
                            colorClass={profitMargin >= 0 ? 'text-green-600' : 'text-destructive'}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Per-Item Profitability</CardTitle>
                    <CardDescription>Analysis of profit generated by each menu item.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Menu Item</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Cost/Unit</TableHead>
                                <TableHead className="text-right">Profit/Unit</TableHead>
                                <TableHead className="text-right">Units Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-right">Total Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profitData.map(item => (
                                <TableRow key={item.id} className={item.profitPerUnit < 0 ? 'bg-destructive/5' : ''}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right font-mono">₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono text-amber-600">₹{(item.costOfGoods || 0).toFixed(2)}</TableCell>
                                    <TableCell className={`text-right font-mono font-semibold ${item.profitPerUnit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        ₹{item.profitPerUnit.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">{item.unitsSold}</TableCell>
                                    <TableCell className="text-right font-mono">₹{item.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono text-amber-600">₹{item.totalCost.toFixed(2)}</TableCell>
                                    <TableCell className={`text-right font-mono font-bold ${item.totalProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                       ₹{item.totalProfit.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
