import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { FoodItemWithStatus, QUANTITY_UNITS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Utensils } from "lucide-react";

const formSchema = z.object({
  quantity: z.coerce.number()
    .min(0.01, "Quantity must be greater than 0")
    .transform(val => Math.round(val)), // Round to integer
  unit: z.string().min(1, "Please select a unit"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ConsumeItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoodItemWithStatus;
};

export default function ConsumeItemDialog({ open, onOpenChange, item }: ConsumeItemDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: item.quantity,
      unit: item.unit,
      notes: "",
    },
  });

  const consumeMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // If consuming full quantity, mark as completely consumed
      // Create a consumption entry that matches the expected schema
      const consumeData = {
        foodItemId: item.id,
        quantity: parseInt(values.quantity.toString()),  // Ensure it's an integer
        unit: values.unit,
        consumptionDate: new Date().toISOString().split('T')[0],
        notes: values.notes || null,
        estimatedValue: null,
      };
      
      await apiRequest('POST', '/api/consumption-entries', consumeData);
      
      // Update item quantity if partially consumed
      if (values.quantity < item.quantity) {
        await apiRequest('PATCH', `/api/food-items/${item.id}`, {
          quantity: item.quantity - values.quantity,
        });
      } else {
        // If fully consumed, delete the item
        await apiRequest('DELETE', `/api/food-items/${item.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/consumption-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/consumption-insights'] });
      
      toast({
        title: "Item consumed",
        description: "The item has been successfully marked as consumed.",
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark item as consumed: ${error}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    consumeMutation.mutate(values);
  };

  const isFullQuantity = form.watch("quantity") >= item.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Utensils className="w-5 h-5 mr-2 text-primary" />
            Mark {item.name} as Consumed
          </DialogTitle>
          <DialogDescription>
            Record this item as consumed to track your consumption patterns and reduce waste.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    {isFullQuantity && (
                      <FormDescription className="text-amber-600">
                        This will remove the item from inventory
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUANTITY_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about how this item was used"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {isSubmitting ? "Saving..." : "Mark as Consumed"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}