
"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockItem } from '@/lib/types';
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<StockItem, 'id'> | StockItem) => void;
  item: StockItem | null;
}

const stockItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'piece'], { required_error: 'Please select a unit' }),
  quantityInStock: z.coerce.number().min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.coerce.number().min(0, 'Threshold cannot be negative'),
  averageCostPerUnit: z.coerce.number().min(0, 'Cost cannot be negative'),
});

export default function StockItemForm({ isOpen, onClose, onSave, item }: StockItemFormProps) {
  const form = useForm<z.infer<typeof stockItemSchema>>({
    resolver: zodResolver(stockItemSchema),
  });
  
  useEffect(() => {
    form.reset(item ? {
      ...item
    } : {
      name: '',
      unit: undefined,
      quantityInStock: 0,
      lowStockThreshold: 0,
      averageCostPerUnit: 0,
    });
  }, [item, form]);


  const onSubmit = (values: z.infer<typeof stockItemSchema>) => {
    if (item) {
      onSave({ ...item, ...values });
    } else {
      onSave(values);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='font-headline'>{item ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the details of the stock item.' : 'Fill in the details for the new stock item.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. All-Purpose Flour" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measurement</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="l">Liter (l)</SelectItem>
                      <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="quantityInStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Quantity In Stock</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 10.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 2.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="averageCostPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Cost Per Unit (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 150.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
