
"use client";

import React, { useState } from 'react';
import type { Supplier, StockItem, PurchaseOrder, MenuItem, MenuItemIngredient } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import StockItemForm from './stock-item-form';
import MenuItemRecipeForm from './menu-item-recipe-form';
import PurchaseOrderForm from './purchase-order-form';

// Dummy forms for now. In a real app, these would be proper modals with forms.
const SupplierForm = () => <div>Supplier Form Placeholder</div>;


interface SupplyChainManagementProps {
    suppliers: Supplier[];
    stockItems: StockItem[];
    purchaseOrders: PurchaseOrder[];
    menuItems: MenuItem[];
    onAddSupplier: (data: Omit<Supplier, 'id'>) => void;
    onUpdateSupplier: (data: Supplier) => void;
    onDeleteSupplier: (id: string) => void;
    onAddStockItem: (data: Omit<StockItem, 'id'>) => void;
    onUpdateStockItem: (data: StockItem) => void;
    onDeleteStockItem: (id: string) => void;
    onAddPurchaseOrder: (data: Omit<PurchaseOrder, 'id'>) => void;
    onReceivePurchaseOrder: (id: string) => void;
    onUpdateMenuItem: (item: MenuItem) => void;
}

export default function SupplyChainManagement({
    suppliers,
    stockItems,
    purchaseOrders,
    menuItems,
    onAddSupplier,
    onUpdateSupplier,
    onDeleteSupplier,
    onAddStockItem,
    onUpdateStockItem,
    onDeleteStockItem,
    onAddPurchaseOrder,
    onReceivePurchaseOrder,
    onUpdateMenuItem,
}: SupplyChainManagementProps) {
    
    const [isStockItemFormOpen, setIsStockItemFormOpen] = useState(false);
    const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
    const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
    const [editingRecipeItem, setEditingRecipeItem] = useState<MenuItem | null>(null);
    const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);


    // These would be implemented with state and modals
    const handleAddSupplierClick = () => alert("To be implemented: Add Supplier Form");
    
    const handleOpenStockItemForm = (item: StockItem | null = null) => {
        setEditingStockItem(item);
        setIsStockItemFormOpen(true);
    }
    
    const handleCloseStockItemForm = () => {
        setEditingStockItem(null);
        setIsStockItemFormOpen(false);
    }

    const handleSaveStockItem = (itemData: Omit<StockItem, 'id'> | StockItem) => {
        if ('id' in itemData) {
            onUpdateStockItem(itemData);
        } else {
            onAddStockItem(itemData);
        }
    };
    
    const handleEditRecipeClick = (item: MenuItem) => {
        setEditingRecipeItem(item);
        setIsRecipeFormOpen(true);
    };
    
    const handleCloseRecipeForm = () => {
        setEditingRecipeItem(null);
        setIsRecipeFormOpen(false);
    };

    const handleSaveRecipe = (item: MenuItem) => {
        onUpdateMenuItem(item);
        handleCloseRecipeForm();
    };
    
    const handleSavePurchaseOrder = (data: Omit<PurchaseOrder, 'id'>) => {
        onAddPurchaseOrder(data);
    };


    return (
        <>
        <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stock">Stock Levels</TabsTrigger>
                <TabsTrigger value="recipes">Menu Recipes</TabsTrigger>
                <TabsTrigger value="purchasing">Purchasing</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="mt-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline">Stock Items</CardTitle>
                                <CardDescription>Manage raw ingredients and supplies.</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenStockItemForm()}>
                                <PlusCircle className="mr-2"/> Add Stock Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>In Stock</TableHead>
                                    <TableHead>Low Stock At</TableHead>
                                    <TableHead>Avg. Cost/Unit</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockItems.map(item => (
                                    <TableRow key={item.id} className={item.quantityInStock <= item.lowStockThreshold ? 'bg-destructive/10' : ''}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.quantityInStock.toFixed(2)} {item.unit}</TableCell>
                                        <TableCell>{item.lowStockThreshold} {item.unit}</TableCell>
                                        <TableCell>₹{item.averageCostPerUnit.toFixed(2)}</TableCell>
                                        <TableCell>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenStockItemForm(item)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteStockItem(item.id)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="recipes" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Menu Item Recipes</CardTitle>
                        <CardDescription>Define the ingredients for each menu item to track costs and stock usage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Menu Item</TableHead>
                                    <TableHead>Ingredients</TableHead>
                                    <TableHead>Calculated Cost</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {menuItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            {(item.ingredients?.length || 0) > 0 ? 
                                                item.ingredients.map(ing => {
                                                    const stock = stockItems.find(si => si.id === ing.stockItemId);
                                                    return <div key={ing.stockItemId}>{ing.quantity}{stock?.unit} {stock?.name || 'Unknown'}</div>
                                                })
                                                : <span className="text-muted-foreground">Not set</span>
                                            }
                                        </TableCell>
                                        <TableCell>₹{(item.costOfGoods || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleEditRecipeClick(item)}><Pencil className="mr-2 h-3 w-3"/> Edit Recipe</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="purchasing" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline">Purchase Orders</CardTitle>
                                <CardDescription>Track orders from suppliers to replenish stock.</CardDescription>
                            </div>
                            <Button onClick={() => setIsPurchaseOrderFormOpen(true)}>
                                <PlusCircle className="mr-2"/> New Purchase Order
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[500px]">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.map(po => (
                                    <TableRow key={po.id}>
                                        <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown'}</TableCell>
                                        <TableCell>₹{po.totalCost.toFixed(2)}</TableCell>
                                        <TableCell><Badge variant={po.status === 'received' ? 'default' : 'secondary'}>{po.status}</Badge></TableCell>
                                        <TableCell>
                                            {po.status === 'ordered' && (
                                                <Button size="sm" variant="outline" onClick={() => onReceivePurchaseOrder(po.id)}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Received
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="mt-6">
                 <Card>
                    <CardHeader>
                         <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline">Suppliers</CardTitle>
                                <CardDescription>Manage your vendors.</CardDescription>
                            </div>
                            <Button onClick={handleAddSupplierClick}>
                                <PlusCircle className="mr-2"/> Add Supplier
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[500px]">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{s.name}</TableCell>
                                        <TableCell>{s.contactPerson || 'N/A'}</TableCell>
                                        <TableCell>{s.phone}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <StockItemForm
            isOpen={isStockItemFormOpen}
            onClose={handleCloseStockItemForm}
            onSave={handleSaveStockItem}
            item={editingStockItem}
        />

        {editingRecipeItem && (
             <MenuItemRecipeForm
                isOpen={isRecipeFormOpen}
                onClose={handleCloseRecipeForm}
                onSave={handleSaveRecipe}
                item={editingRecipeItem}
                stockItems={stockItems}
            />
        )}
        
        <PurchaseOrderForm 
            isOpen={isPurchaseOrderFormOpen}
            onClose={() => setIsPurchaseOrderFormOpen(false)}
            onSave={handleSavePurchaseOrder}
            suppliers={suppliers}
            stockItems={stockItems}
        />
        </>
    );
}
