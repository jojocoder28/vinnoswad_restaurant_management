"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuItem, Order, Table } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  waiterId: string;
  onCreateOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status'>, tableId: string) => void;
  tables: Table[];
}

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Please select an item'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const orderFormSchema = z.object({
  tableId: z.string().min(1, 'Table number is required'),
  items: z.array(orderItemSchema).min(1, 'Please add at least one item to the order'),
});

export default function OrderForm({ isOpen, onClose, menuItems, waiterId, onCreateOrder, tables }: OrderFormProps) {
  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      tableId: '',
      items: [{ menuItemId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = (values: z.infer<typeof orderFormSchema>) => {
    const selectedTable = tables.find(t => t.id === values.tableId);
    if (!selectedTable) return;

    const orderData = {
      tableNumber: selectedTable.tableNumber,
      items: values.items,
      waiterId,
    }
    onCreateOrder(orderData, values.tableId);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className='font-headline'>Create New Order</DialogTitle>
          <DialogDescription>Fill in the details to place a new order.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          Table {table.tableNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Order Items</FormLabel>
              <ScrollArea className="h-60 mt-2 pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.menuItemId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {menuItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} - ${item.price.toFixed(2)}
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
                        <FormItem className='w-20'>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              </ScrollArea>
               {form.formState.errors.items && (
                 <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>
               )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ menuItemId: '', quantity: 1 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Place Order</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
