
"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuItem } from '@/lib/types';
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MenuItem, 'id'> | MenuItem) => void;
  item: MenuItem | null;
}

const menuItemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
});

export default function MenuItemForm({ isOpen, onClose, onSave, item }: MenuItemFormProps) {
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
  });
  
  useEffect(() => {
    form.reset(item || {
      name: '',
      category: '',
      price: 0,
      imageUrl: '',
    });
  }, [item, form]);


  const onSubmit = (values: z.infer<typeof menuItemSchema>) => {
    const finalValues = {
        ...values,
        imageUrl: values.imageUrl || `https://placehold.co/400x300.png?text=${values.name.replace(/\s/g, '+')}`,
    };

    if (item) {
      onSave({ ...item, ...finalValues });
    } else {
      // For new items, default availability to true
      onSave({ ...finalValues, isAvailable: true });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='font-headline'>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the details of the menu item.' : 'Fill in the details for the new menu item.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Margherita Pizza" {...field} />
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
                  <FormControl>
                    <Input placeholder="e.g. Main Course, Appetizer, Dessert" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 12.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                   <FormDescription>Leave blank to use a placeholder image.</FormDescription>
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
