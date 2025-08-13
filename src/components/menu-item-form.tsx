
"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuItem } from '@/lib/types';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
  image: z.any().optional(),
});

export default function MenuItemForm({ isOpen, onClose, onSave, item }: MenuItemFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
  });
  
  useEffect(() => {
    form.reset(item ? {
      name: item.name,
      category: item.category,
      price: item.price,
    } : {
      name: '',
      category: '',
      price: 0,
      image: undefined,
    });
  }, [item, form]);


  const onSubmit = async (values: z.infer<typeof menuItemSchema>) => {
    setLoading(true);
    try {
      let imageUrl = item?.imageUrl; // Keep the existing image if no new one is uploaded

      // If a new image file is selected, upload it
      if (values.image && values.image.length > 0) {
        const file = values.image[0];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Image upload failed');
        }
        imageUrl = result.url;
      }

      // If it's a new item and no image was uploaded or existed, use a placeholder
      if (!imageUrl) {
        imageUrl = `https://placehold.co/400x300.png?text=${values.name.replace(/\s/g, '+')}`;
      }

      const finalValues = {
        name: values.name,
        category: values.category,
        price: values.price,
        imageUrl: imageUrl,
      };

      if (item) {
        onSave({ ...item, ...finalValues });
      } else {
        // For new items, initialize ingredients and cost
        onSave({ 
            ...finalValues, 
            isAvailable: true, 
            ingredients: [], 
            costOfGoods: 0 
        });
      }
      onClose();

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
       toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormDescription>
                    {item ? 'Leave blank to keep the current image.' : 'Upload an image for the menu item.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Saving...' : 'Save Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
