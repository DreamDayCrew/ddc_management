import { useEffect, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VendorForm } from "@/components/forms/vendor-form";
import { AssetForm } from "@/components/forms/asset-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FulfillmentFormProps {
  plan?: FulfillmentPlan;
  requirementId: string;
  eventId: string;
  onSuccess?: () => void;
}

export function FulfillmentForm({ plan, requirementId, eventId, onSuccess }: FulfillmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!plan;
  const [assetOpen, setAssetOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorSearchAll, setVendorSearchAll] = useState(false);
  const [assetSearchAll, setAssetSearchAll] = useState(false);
  const [vendorCreateOpen, setVendorCreateOpen] = useState(false);
  const [assetCreateOpen, setAssetCreateOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("");
  const [newVendorRating, setNewVendorRating] = useState("");
  const [vendorCreateLoading, setVendorCreateLoading] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("");
  const [newAssetQuantity, setNewAssetQuantity] = useState("1");
  const [assetCreateLoading, setAssetCreateLoading] = useState(false);

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
      assetType: plan?.assetType || "",
      assetName: plan?.assetName || "",
    },
  });

  const planType = form.watch("planType");
  const assetType = form.watch("assetType");
  const assetPurchaseStatus = form.watch("assetPurchaseStatus");
  const selectedVendorCategory = form.watch("vendorCategory");
  const selectedVendorId = form.watch("vendorId");
  const selectedAssetCategory = form.watch("assetCategory");
  const selectedAssetId = form.watch("assetId");
  const paymentAmount = form.watch("payment") as string;
  const showPaymentStatus = paymentAmount ? parseFloat(paymentAmount) > 0 : false;

  // Filter vendors based on selected category
  const filteredVendors = selectedVendorCategory 
    ? vendors?.filter(vendor => vendor.category === selectedVendorCategory) || []
    : [];

  const vendorsToShow = vendorSearchAll ? vendors || [] : filteredVendors;

  const selectedVendor = vendors?.find((vendor) => vendor.id === selectedVendorId);

  const vendorRatingInfo = (() => {
    if (!selectedVendor || selectedVendor.rating == null || selectedVendor.rating <= 0) return null;
    if (selectedVendor.rating >= 4) {
      return { text: selectedVendor.rating +" / 5 • Strong choice", colorClass: "text-green-700", bgClass: "bg-green-50", borderClass: "border-green-200" };
    }
    if (selectedVendor.rating >= 2) {
      return { text: selectedVendor.rating + " / 5 • Risky choice", colorClass: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
    }
    if (selectedVendor.rating === 1) {
      return { text: "1 / 5 • Avoid this vendor", colorClass: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
    }
    return null;
  })();

  // Filter assets based on selected category
  const filteredAssets = selectedAssetCategory 
    ? assets?.filter(a => a.category === selectedAssetCategory) || []
    : [];

  const assetsToShow = assetSearchAll ? assets || [] : filteredAssets;

  // Reset vendorId when vendorCategory changes
  useEffect(() => {
    if (!selectedVendorCategory) return;
    // Avoid clearing while the vendor selection is still syncing
    if (!selectedVendor) return;
    if (selectedVendor.category === selectedVendorCategory) return;
      form.setValue("vendorId", "");
  }, [selectedVendorCategory, selectedVendor, form]);

  // Reset assetId when assetCategory changes
  useEffect(() => {
    const currentAsset = assets?.find((a) => a.id === selectedAssetId);
    if (!selectedAssetCategory) return;
    if (currentAsset && currentAsset.category === selectedAssetCategory) return;
      form.setValue("assetId", "");
  }, [selectedAssetCategory, selectedAssetId, assets, form]);

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
      // Ensure assetId is null when not an Asset plan or for Temporary asset type
      ...((data.planType !== 'Asset' && data.assetType !== 'Inventory') && { assetId: null }),
      ...(data.planType === 'Asset' && data.assetType === 'Temporary' && { assetId: null }),
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

  // creation handled via VendorForm/AssetForm dialogs

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
              <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
            {showPaymentStatus && (
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "Pending"}
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
            )}
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
              render={({ field }) => {
                const selected = vendors?.find((v) => v.id === field.value);
                return (
                  <FormItem className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                  <FormLabel>Vendor</FormLabel>
                      <div className="flex items-center gap-2 text-xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0"
                          onClick={() => setVendorSearchAll((v) => !v)}
                          disabled={planType !== "Vendor"}
                        >
                          {vendorSearchAll ? "Filter by category" : "Search all"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0"
                          onClick={() => {
                            setNewVendorCategory(selectedVendorCategory || "");
                            setVendorCreateOpen(true);
                          }}
                          disabled={planType !== "Vendor"}
                  >
                          Add new & link
                        </Button>
                      </div>
                    </div>
                    <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                      <PopoverTrigger asChild>
                    <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={vendorOpen}
                            disabled={planType !== "Vendor"}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="select-vendor"
                          >
                            {selected
                              ? selected.name
                              : vendorsToShow.length === 0
                                ? vendorSearchAll
                                  ? "No vendors available"
                                  : "Select a vendor category first"
                                : "Select vendor"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search vendors..." />
                          <CommandList>
                            <CommandEmpty>No vendor found.</CommandEmpty>
                            <CommandGroup>
                              {vendorsToShow.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  value={vendor.name}
                                  onSelect={() => {
                                    field.onChange(vendor.id);
                                    if (!selectedVendorCategory && vendor.category) {
                                      form.setValue("vendorCategory", vendor.category);
                                    }
                                    setVendorOpen(false);
                                  }}
                                  data-testid={`vendor-option-${vendor.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === vendor.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                          {vendor.name}
                                  {vendor.category ? (
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {vendor.category}
                                    </span>
                                  ) : null}
                                </CommandItem>
                      ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
            {vendorRatingInfo && (
              <div className={`mt-2 rounded-md border px-3 py-2 text-sm ${vendorRatingInfo.bgClass} ${vendorRatingInfo.borderClass} ${vendorRatingInfo.colorClass}`}>
                {vendorRatingInfo.text}
            </div>
            )}
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

            {showPaymentStatus && (
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "Pending"}
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
            )}
          </>
        )}

        {planType === "Asset" && (
          <>
            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-asset-type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {assetType === "Inventory" && (
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
                  render={({ field }) => {
                    const selectedAsset = assets?.find(a => a.id === field.value);
                    return (
                      <FormItem className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                        <FormLabel>Asset</FormLabel>
                          <div className="flex items-center gap-2 text-xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0"
                              onClick={() => setAssetSearchAll((v) => !v)}
                              disabled={planType !== "Asset"}
                            >
                              {assetSearchAll ? "Filter by category" : "Search all"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0"
                              onClick={() => {
                                setNewAssetCategory(selectedAssetCategory || "");
                                setAssetCreateOpen(true);
                              }}
                              disabled={planType !== "Asset"}
                            >
                              Add new & link
                            </Button>
                          </div>
                        </div>
                        <Popover open={assetOpen} onOpenChange={setAssetOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={assetOpen}
                                disabled={planType !== "Asset"}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="select-asset"
                              >
                                {selectedAsset
                                      ? selectedAsset.name 
                                  : assetsToShow.length === 0
                                    ? assetSearchAll
                                      ? "No assets available"
                                      : "Select an asset category first"
                                      : "Search and select asset..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search assets..." 
                                data-testid="input-asset-search"
                              />
                              <CommandList>
                                <CommandEmpty>No asset found.</CommandEmpty>
                                <CommandGroup>
                                  {assetsToShow.map((asset) => (
                                    <CommandItem
                                      key={asset.id}
                                      value={asset.name}
                                      onSelect={() => {
                                        field.onChange(asset.id);
                                        if (!selectedAssetCategory && asset.category) {
                                          form.setValue("assetCategory", asset.category);
                                        }
                                        setAssetOpen(false);
                                      }}
                                      data-testid={`asset-option-${asset.id}`}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === asset.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {asset.name}
                                      {asset.category ? (
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {asset.category}
                                        </span>
                                      ) : null}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
              </>
            )}
            {assetType === "Temporary" && (
              <>
                <FormField
                  control={form.control}
                  name="assetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          type="text" 
                          placeholder="Enter asset name" 
                          data-testid="input-asset-name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {((assetType === "Inventory" && assetPurchaseStatus === "New") || assetType === "Temporary") && (
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

      <Dialog open={vendorCreateOpen} onOpenChange={setVendorCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Vendor & Link</DialogTitle>
          </DialogHeader>
          <VendorForm
            onCreated={(created) => {
              form.setValue("vendorCategory", created.category || "");
              form.setValue("vendorId", created.id);
              setVendorCreateOpen(false);
              setVendorSearchAll(false);
            }}
            onSuccess={() => {
              // handled in onCreated
            }}
          />
          <DialogFooter className="hidden" />
        </DialogContent>
      </Dialog>

      <Dialog open={assetCreateOpen} onOpenChange={setAssetCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Asset & Link</DialogTitle>
          </DialogHeader>
          <AssetForm
            onCreated={(created) => {
              form.setValue("assetType", "Inventory");
              form.setValue("assetCategory", created.category || "");
              form.setValue("assetId", created.id);
              form.setValue("assetPurchaseStatus", "New", { shouldDirty: true, shouldTouch: true });
              if (created.purchasedAmount != null) {
                form.setValue("payment", String(created.purchasedAmount), { shouldDirty: true, shouldTouch: true });
              }
              setAssetCreateOpen(false);
              setAssetSearchAll(false);
            }}
            onSuccess={() => {
              // handled in onCreated
            }}
          />
          <DialogFooter className="hidden" />
        </DialogContent>
      </Dialog>
    </Form>
  );
}
