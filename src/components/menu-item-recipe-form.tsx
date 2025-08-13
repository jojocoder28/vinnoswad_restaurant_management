
"use client";

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuItem, StockItem } from '@/lib/types';
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface MenuItemRecipeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  item: MenuItem | null;
  stockItems: StockItem[];
}

const ingredientSchema = z.object({
  stockItemId: z.string().min(1, 'Please select an ingredient'),
  quantity: z.coerce.number().positive('Quantity must be a positive number'),
});

const recipeSchema = z.object({
  ingredients: z.array(ingredientSchema),
});

export default function MenuItemRecipeForm({ isOpen, onClose, onSave, item, stockItems }: MenuItemRecipeFormProps) {
  
  const form = useForm<z.infer<typeof recipeSchema>>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      ingredients: [],
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        ingredients: item.ingredients || [],
      });
    }
  }, [item, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const onSubmit = (values: z.infer<typeof recipeSchema>) => {
    if (!item) return;
    onSave({ ...item, ingredients: values.ingredients });
    onClose();
  };
  
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className='font-headline'>Edit Recipe for {item.name}</DialogTitle>
          <DialogDescription>Define the ingredients required to make this menu item.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormLabel>Ingredients</FormLabel>
              <ScrollArea className="h-60 mt-2 pr-4">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.stockItemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an ingredient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stockItems.map(si => (
                                  <SelectItem key={si.id} value={si.id}>
                                    {si.name} ({si.unit})
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
                        name={`ingredients.${index}.quantity`}
                        render={({ field }) => {
                          const selectedStockItem = stockItems.find(si => si.id === form.watch(`ingredients.${index}.stockItemId`));
                          return (
                            <FormItem className='w-28'>
                              <FormLabel className="text-xs text-muted-foreground">{selectedStockItem?.unit || 'Qty'}</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {form.formState.errors.ingredients && (
                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.ingredients.message}</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ stockItemId: '', quantity: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
            </Button>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Recipe</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

