import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertRequirementSchema, type Requirement, type InsertRequirement, type Configuration, type TeamMember } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequirementFormProps {
  requirement?: Requirement;
  eventId: string;
  onSuccess?: () => void;
}

export function RequirementForm({ requirement, eventId, onSuccess }: RequirementFormProps) {
  const { toast } = useToast();
  const isEditing = !!requirement;

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const form = useForm<Omit<InsertRequirement, 'order'>>({
    resolver: zodResolver(insertRequirementSchema.omit({ order: true })),
    defaultValues: {
      eventId: requirement?.eventId || eventId,
      requirement: requirement?.requirement || "",
      requirementOwner: requirement?.requirementOwner || "",
      requirementStatus: requirement?.requirementStatus || "To Do",
      price: requirement?.price || 0,
      quantity: requirement?.quantity || 1,
    },
  });

  // Watch price and quantity fields for local calculation
  const price = form.watch('price');
  const quantity = form.watch('quantity');
  
  // Debug log form values
  console.log('Form values:', {
    price,
    quantity,
    priceType: typeof price,
    quantityType: typeof quantity
  });
  
  // Calculate order for display only
  const order = (Number(price) || 0) * (Number(quantity) || 1);
  console.log('Calculated order:', order);

  const createMutation = useMutation({
    mutationFn: async (data: InsertRequirement) => {
      const res = await apiRequest("POST", "/api/requirements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertRequirement) => {
      const res = await apiRequest("PATCH", `/api/requirements/${requirement?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertRequirement, 'order'>) => {
    // Calculate the order before submission
    const order = (Number(data.price) || 0) * (Number(data.quantity) || 1);
    
    console.log("Submitting form data:", {
      ...data,
      order // Include order in the logged data
    });
    
    // Include the calculated order in the submission
    const submissionData = {
      ...data,
      order
    };
    
    if (isEditing && requirement?.id) {
      updateMutation.mutate({ id: requirement.id, ...submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="requirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter requirement" data-testid="input-requirement" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirementOwner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Owner</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger data-testid="select-requirement-owner">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
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
          name="requirementStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-requirement-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {config?.planStatuses?.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter price for single quantity"
                  data-testid="input-requirement-price"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter the quantity"
                  data-testid="input-requirement-quantity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Invoice Amount (Auto-calculated)</FormLabel>
          <FormControl>
            <Input
              type="number"
              readOnly
              className="bg-muted/50"
              value={order}
              data-testid="input-requirement-order"
            />
          </FormControl>
        </FormItem>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-requirement">
            {isPending ? "Saving..." : isEditing ? "Update Requirement" : "Create Requirement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
