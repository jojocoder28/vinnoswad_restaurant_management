
"use client";

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PurchaseOrder, Supplier, StockItem } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<PurchaseOrder, 'id'>) => void;
  suppliers: Supplier[];
  stockItems: StockItem[];
}

const purchaseOrderItemSchema = z.object({
  stockItemId: z.string().min(1, 'Please select an item'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  costPerUnit: z.coerce.number().nonnegative('Cost must be non-negative'),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier'),
  items: z.array(purchaseOrderItemSchema).min(1, 'Please add at least one item'),
});

export default function PurchaseOrderForm({ isOpen, onClose, onSave, suppliers, stockItems }: PurchaseOrderFormProps) {
  
  const form = useForm<z.infer<typeof purchaseOrderSchema>>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      items: [{ stockItemId: '', quantity: 0, costPerUnit: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const totalCost = useMemo(() => {
    return watchedItems.reduce((total, item) => total + ((item.quantity || 0) * (item.costPerUnit || 0)), 0);
  }, [watchedItems]);


  const onSubmit = (values: z.infer<typeof purchaseOrderSchema>) => {
    const finalData = {
        ...values,
        totalCost,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'ordered' as const,
    };
    onSave(finalData);
    handleClose();
  };
  
  const handleClose = () => {
    form.reset({
      supplierId: '',
      items: [{ stockItemId: '', quantity: 0, costPerUnit: 0 }],
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className='font-headline'>Create Purchase Order</DialogTitle>
          <DialogDescription>Create a new order to send to a supplier to replenish your stock.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Items to Order</FormLabel>
              <ScrollArea className="h-60 pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 items-end gap-2 p-2 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.stockItemId`}
                      render={({ field }) => (
                        <FormItem className="col-span-5">
                          <FormLabel className="text-xs text-muted-foreground">Item</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stockItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className='col-span-2'>
                          <FormLabel className="text-xs text-muted-foreground">Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`items.${index}.costPerUnit`}
                      render={({ field }) => (
                        <FormItem className='col-span-2'>
                          <FormLabel className="text-xs text-muted-foreground">Cost/Unit</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2 flex items-center gap-1">
                        <p className="text-sm font-medium w-full text-right">= ₹{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.costPerUnit || 0)).toFixed(2)}</p>
                    </div>

                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="col-span-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => append({ stockItemId: '', quantity: 0, costPerUnit: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
              </Button>
               {form.formState.errors.items && typeof form.formState.errors.items === 'object' && 'message' in form.formState.errors.items && (
                 <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>
               )}
            </div>
            
            <Separator />

            <div className="flex justify-end items-center text-lg font-bold">
                <span>Total Order Cost:</span>
                <span className="font-mono ml-4">₹{totalCost.toFixed(2)}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Create Purchase Order</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
