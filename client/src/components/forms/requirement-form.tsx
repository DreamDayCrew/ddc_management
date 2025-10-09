import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertRequirementSchema, type Requirement, type InsertRequirement, type Configuration } from "@shared/schema";
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

  const form = useForm<InsertRequirement>({
    resolver: zodResolver(insertRequirementSchema),
    defaultValues: {
      eventId: requirement?.eventId || eventId,
      requirement: requirement?.requirement || "",
      requirementOwner: requirement?.requirementOwner || "",
      requirementStatus: requirement?.requirementStatus || "To Do",
      order: requirement?.order || 0,
    },
  });

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

  const onSubmit = (data: InsertRequirement) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="Enter owner" data-testid="input-requirement-owner" />
              </FormControl>
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
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Enter order number"
                  data-testid="input-requirement-order"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-requirement">
            {isPending ? "Saving..." : isEditing ? "Update Requirement" : "Create Requirement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
