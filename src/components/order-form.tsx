
"use client";

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuItem, Order, Table, OrderItem } from '@/lib/types';
import { useEffect, useMemo } from 'react';

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
  onCreateOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'items'> & { items: Omit<OrderItem, 'price'>[] }, tableId: string) => void;
  onUpdateOrder?: (orderId: string, items: Omit<OrderItem, 'price'>[]) => void;
  tables: Table[];
  editingOrder?: Order | null;
}

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Please select an item'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const orderFormSchema = z.object({
  tableId: z.string().min(1, 'Table number is required'),
  items: z.array(orderItemSchema).min(1, 'Please add at least one item to the order'),
});

export default function OrderForm({ isOpen, onClose, menuItems, waiterId, onCreateOrder, onUpdateOrder, tables, editingOrder }: OrderFormProps) {
  
  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      tableId: '',
      items: [{ menuItemId: '', quantity: 1 }],
    },
  });

  const availableMenuItems = useMemo(() => menuItems.filter(item => item.isAvailable), [menuItems]);


  useEffect(() => {
    if (editingOrder) {
      const table = tables.find(t => t.tableNumber === editingOrder.tableNumber);
      form.reset({
        tableId: table?.id || '',
        items: editingOrder.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
    } else {
       form.reset({
        tableId: '',
        items: [{ menuItemId: '', quantity: 1 }]
      });
    }
  }, [editingOrder, form, tables]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = (values: z.infer<typeof orderFormSchema>) => {
    if (editingOrder && onUpdateOrder) {
        onUpdateOrder(editingOrder.id, values.items);
    } else {
        const selectedTable = tables.find(t => t.id === values.tableId);
        if (!selectedTable) return;

        const orderData = {
          tableNumber: selectedTable.tableNumber,
          items: values.items,
          waiterId,
        }
        onCreateOrder(orderData, values.tableId);
    }
    
    handleClose();
  };
  
  const handleClose = () => {
    form.reset({
      tableId: '',
      items: [{ menuItemId: '', quantity: 1 }]
    });
    onClose();
  }
  
  const isEditing = !!editingOrder;
  const waiterTables = tables.filter(t => t.status === 'available' || t.waiterId === waiterId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className='font-headline'>{isEditing ? 'Edit Order' : 'Create New Order'}</DialogTitle>
          <DialogDescription>{isEditing ? `Updating order for Table ${editingOrder.tableNumber}.` : 'Fill in the details to place a new order.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {waiterTables.map(table => (
                        <SelectItem key={table.id} value={table.id} disabled={!isEditing && table.status === 'occupied' && table.waiterId !== waiterId}>
                          Table {table.tableNumber} {table.status === 'occupied' && table.waiterId !== waiterId ? '(Occupied by another waiter)' : ''}
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
                              {availableMenuItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} - ₹{item.price.toFixed(2)}
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
               {form.formState.errors.items && typeof form.formState.errors.items === 'object' && 'message' in form.formState.errors.items && (
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
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{isEditing ? 'Update Order' : 'Place Order'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
