import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  insertFulfillmentPlanSchema, 
  type FulfillmentPlan, 
  type InsertFulfillmentPlan,
  type Configuration,
  type TeamMember,
  type Vendor,
  type Asset
} from "@shared/schema";
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

interface FulfillmentFormProps {
  plan?: FulfillmentPlan;
  requirementId: string;
  eventId: string;
  onSuccess?: () => void;
}

export function FulfillmentForm({ plan, requirementId, eventId, onSuccess }: FulfillmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!plan;

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });
  
  // Get vendor categories from config
  const vendorCategories = config?.vendorCategories || [];
  const assetCategories = config?.assetCategories || [];

  const form = useForm<InsertFulfillmentPlan>({
    resolver: zodResolver(insertFulfillmentPlanSchema),
    defaultValues: {
      requirementId: plan?.requirementId || requirementId,
      planType: (plan?.planType || "") as "Vendor" | "Team" | "Asset",
      teamMemberId: plan?.teamMemberId || "",
      teamRole: plan?.teamRole || "",
      vendorId: plan?.vendorId || "",
      vendorCategory: plan?.vendorCategory || "",
      payment: plan?.payment ? String(plan.payment) : "0",
      paymentStatus: plan?.paymentStatus || "Pending",
      assetId: plan?.assetId || "",
      assetCategory: plan?.assetCategory || "",
      assetPurchaseStatus: plan?.assetPurchaseStatus || "",
      planStatus: plan?.planStatus || "To Do",
    },
  });

  const planType = form.watch("planType");
  const assetPurchaseStatus = form.watch("assetPurchaseStatus");
  const selectedVendorCategory = form.watch("vendorCategory");
  const selectedAssetCategory = form.watch("assetCategory");

  // Filter vendors based on selected category
  const filteredVendors = selectedVendorCategory 
    ? vendors?.filter(vendor => vendor.category === selectedVendorCategory) || []
    : [];

  // Filter assets based on selected category
  const filteredAssets = selectedAssetCategory 
    ? assets?.filter(a => a.category === selectedAssetCategory) || []
    : [];

  // Reset vendorId when vendorCategory changes
  useEffect(() => {
    if (selectedVendorCategory) {
      form.setValue("vendorId", "");
    }
  }, [selectedVendorCategory, form]);

  // Reset assetId when assetCategory changes
  useEffect(() => {
    if (selectedAssetCategory) {
      form.setValue("assetId", "");
    }
  }, [selectedAssetCategory, form]);

  // Reset fields when planType changes
  useEffect(() => {
    if (planType !== "Vendor") {
      form.setValue("vendorId", "");
      form.setValue("vendorCategory", "");
    }
    if (planType !== "Asset") {
      form.setValue("assetId", "");
      form.setValue("assetCategory", "");
    }
  }, [planType, form]);

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      form.reset({
        ...plan,
        payment: plan.payment ? String(plan.payment) : "",
        // Convert string dates to Date objects if they exist
        ...(plan.createdAt && { createdAt: new Date(plan.createdAt) }),
        ...(plan.updatedAt && { updatedAt: new Date(plan.updatedAt) })
      });
    }
  }, [plan, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertFulfillmentPlan) => {
      const res = await apiRequest("POST", "/api/plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Fulfillment plan created successfully",
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
    mutationFn: async (data: InsertFulfillmentPlan) => {
      console.log('Update mutation started with data:', data);
      try {
        const res = await apiRequest("PATCH", `/api/plans/${plan?.id}`, data);
        const result = await res.json();
        console.log('Update mutation successful, response:', result);
        return result;
      } catch (error) {
        console.error('Update mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Update mutation onSuccess called');
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update mutation onError:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFulfillmentPlan) => {
    console.log('Form submitted with data:', data);
    
    // Transform data for the API
    const transformedData = {
      ...data,
      // Convert empty strings to 0 for payment
      payment: data.payment === "" ? "0" : data.payment,
      // Set default payment status if not provided
      paymentStatus: data.paymentStatus || "Pending",
      // Convert date strings to Date objects
      ...(data.createdAt && { createdAt: new Date(data.createdAt) }),
      updatedAt: new Date(),
      // Ensure teamMemberId is null when not a Team plan
      ...(data.planType !== 'Team' && { teamMemberId: null }),
      // Ensure vendorId is null when not a Vendor plan
      ...(data.planType !== 'Vendor' && { vendorId: null }),
      // Ensure assetId is null when not an Asset plan
      ...(data.planType !== 'Asset' && { assetId: null }),
    };

    console.log('Transformed data before mutation:', transformedData);

    if (isEditing) {
      console.log('Calling update mutation');
      updateMutation.mutate(transformedData);
    } else {
      console.log('Calling create mutation');
      createMutation.mutate(transformedData);
    }
  };

  // Add form state logging
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('Form value changed:', { value, name, type });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Log form errors
  useEffect(() => {
    console.log('Form errors:', form.formState.errors);
  }, [form.formState.errors]);

  // Add form submission handler with error logging
  const handleSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    form.handleSubmit(onSubmit)(e).catch(error => {
      console.error('Form submission error:', error);
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="planType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-plan-type">
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Vendor">Vendor</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {planType === "Team" && (
          <>
            <FormField
              control={form.control}
              name="teamMemberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-team-member">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
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
              name="teamRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-team-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {config?.roles?.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
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
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""} 
                      type="number" 
                      step="0.01" 
                      placeholder="Enter payment amount" 
                      data-testid="input-payment-amount" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {config?.paymentStatuses?.map((status) => (
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
          </>
        )}

        {planType === "Vendor" && (
          <>
            <FormField
              control={form.control}
              name="vendorCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={planType !== "Vendor"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendorCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={!selectedVendorCategory || planType !== "Vendor"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue 
                          placeholder={
                            !selectedVendorCategory 
                              ? "Select a vendor category first" 
                              : filteredVendors.length === 0 
                                ? "No vendors available for this category"
                                : "Select vendor"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
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
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""} 
                      type="number" 
                      step="0.01" 
                      placeholder="Enter payment amount" 
                      data-testid="input-payment-amount" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {config?.paymentStatuses?.map((status) => (
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
          </>
        )}

        {planType === "Asset" && (
          <>
            <FormField
              control={form.control}
              name="assetCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={planType !== "Asset"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={!selectedAssetCategory || planType !== "Asset"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-asset">
                        <SelectValue 
                          placeholder={
                            !selectedAssetCategory 
                              ? "Select an asset category first" 
                              : filteredAssets.length === 0 
                                ? "No assets available for this category"
                                : "Select asset"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
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
              name="assetPurchaseStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Purchase Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-asset-purchase-status">
                        <SelectValue placeholder="Select purchase status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {config?.assetPurchaseStatus?.map((status) => (
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

            {assetPurchaseStatus === "New" && (
              <FormField
                control={form.control}
                name="payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        type="number" 
                        step="0.01" 
                        placeholder="Enter payment amount" 
                        data-testid="input-payment-amount" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="planStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-plan-status">
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-plan">
            {isPending ? "Saving..." : isEditing ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
