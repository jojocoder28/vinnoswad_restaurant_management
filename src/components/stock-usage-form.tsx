
"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockItem, StockUsageLog, StockUsageCategory } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';

interface StockUsageFormProps {
  onSave: (data: Omit<StockUsageLog, 'id' | 'timestamp'>) => void;
  stockItems: StockItem[];
  userId: string;
}

const usageSchema = z.object({
  stockItemId: z.string().min(1, 'Please select a stock item.'),
  quantityUsed: z.coerce.number().positive('Usage quantity must be a positive number.'),
  category: z.enum(['kitchen_prep', 'spillage', 'staff_meal', 'other'], { required_error: 'Please select a category.'}),
  notes: z.string().optional(),
});

const categoryLabels: Record<StockUsageCategory, string> = {
    kitchen_prep: "Kitchen Prep",
    spillage: "Spillage / Waste",
    staff_meal: "Staff Meal",
    other: "Other"
};

export default function StockUsageForm({ onSave, stockItems, userId }: StockUsageFormProps) {
  const form = useForm<z.infer<typeof usageSchema>>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      stockItemId: '',
      quantityUsed: 0,
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof usageSchema>) => {
    onSave({ ...values, recordedBy: userId });
    form.reset();
  };

  const selectedItemId = form.watch('stockItemId');
  const selectedStockItem = stockItems.find(item => item.id === selectedItemId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <FormField
          control={form.control}
          name="stockItemId"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Stock Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stockItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (In Stock: {item.quantityInStock.toFixed(2)} {item.unit})
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
          name="quantityUsed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Used ({selectedStockItem?.unit || 'unit'})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                     <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. For lunch service prep, accidentally dropped..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="md:col-span-1 w-full">Record Usage</Button>
      </form>
    </Form>
  );
}
