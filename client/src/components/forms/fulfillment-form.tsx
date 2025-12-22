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
  type Asset,
  type Event,
  type Expense
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  
  // Expense linking state
  const [showPartialExpenseDialog, setShowPartialExpenseDialog] = useState(false);
  const [partialExpenseAmount, setPartialExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [showPendingConfirmDialog, setShowPendingConfirmDialog] = useState(false);
  const [previousPaymentStatus, setPreviousPaymentStatus] = useState<string | undefined>(plan?.paymentStatus ?? undefined);
  // Track if form is in a valid state for expense operations
  const isPlanLoaded = plan !== undefined && plan?.id !== undefined;
  
  // Pending expense data for Add mode (will be created after plan is saved)
  const [pendingExpenseData, setPendingExpenseData] = useState<{
    amount: string;
    date: string;
  } | null>(null);
  
  // Validation warning state
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  
  // Fetch linked expense by planId (new architecture: expense has fulfillmentPlanId, not plan has expenseId)
  const { data: linkedExpense, refetch: refetchLinkedExpense } = useQuery<Expense | null>({
    queryKey: ["/api/expenses/by-plan", plan?.id],
    queryFn: async () => {
      if (!plan?.id) return null;
      try {
        const res = await fetch(`/api/expenses/by-plan/${plan.id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch linked expense");
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!plan?.id,
  });
  
  // Derive linked expense ID from the query result
  const linkedExpenseId = linkedExpense?.id || null;

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

  // Get event for expense description
  const { data: event } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
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
  const paymentStatus = form.watch("paymentStatus");
  const showPaymentStatus = paymentAmount ? parseFloat(paymentAmount) > 0 : false;
  
  // Calculate total linked expense amount
  const getLinkedExpenseAmount = (): number => {
    if (isEditing && linkedExpense?.amount) {
      return parseFloat(linkedExpense.amount) || 0;
    }
    if (!isEditing && pendingExpenseData?.amount) {
      return parseFloat(pendingExpenseData.amount) || 0;
    }
    return 0;
  };
  
  // Validate payment status against linked expense amount
  const validatePaymentStatusAndExpense = (status: string, planAmount: string, expenseAmount: number): string | null => {
    const planAmountNum = parseFloat(planAmount) || 0;
    const epsilon = 0.01; // Allow small rounding differences
    
    if (status === "Pending") {
      if (expenseAmount > 0) {
        return "Payment status is 'Pending' but an expense is linked. Please change status to 'Paid' or 'Partial', or remove the linked expense.";
      }
    } else if (status === "Paid") {
      if (expenseAmount <= 0) {
        return "Payment status is 'Paid' but no expense is linked. Please link an expense or change status to 'Pending'.";
      }
      if (Math.abs(expenseAmount - planAmountNum) > epsilon) {
        return `Payment status is 'Paid' but expense amount (₹${expenseAmount.toLocaleString("en-IN")}) does not match plan amount (₹${planAmountNum.toLocaleString("en-IN")}). Please update the expense or change status to 'Partial'.`;
      }
    } else if (status === "Partial") {
      if (expenseAmount <= 0) {
        return "Payment status is 'Partial' but no expense is linked. Please link an expense or change status to 'Pending'.";
      }
      if (expenseAmount >= planAmountNum - epsilon) {
        return `Payment status is 'Partial' but expense amount (₹${expenseAmount.toLocaleString("en-IN")}) equals or exceeds plan amount (₹${planAmountNum.toLocaleString("en-IN")}). Please change status to 'Paid' or reduce the expense amount.`;
      }
    }
    return null;
  };
  
  // Update validation warning when relevant values change
  useEffect(() => {
    const expenseAmount = getLinkedExpenseAmount();
    const warning = validatePaymentStatusAndExpense(paymentStatus || "Pending", paymentAmount, expenseAmount);
    setValidationWarning(warning);
  }, [paymentStatus, paymentAmount, linkedExpense, pendingExpenseData]);

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

  // Get recipient name for expense based on plan type
  const getRecipientName = () => {
    if (planType === "Vendor") {
      const vendor = vendors?.find(v => v.id === form.getValues("vendorId"));
      return vendor?.name || "Vendor";
    } else if (planType === "Team") {
      const teamMember = teamMembers?.find(t => t.id === form.getValues("teamMemberId"));
      return teamMember?.name || "Team Member";
    }
    return "Recipient";
  };

  // Handle Link Expense button click - works for both Add and Edit modes
  const handleLinkExpense = () => {
    const currentStatus = form.getValues("paymentStatus");
    
    // Pre-fill from existing linked expense (Edit mode) or pending expense (Add mode) or today
    let existingDate = new Date().toISOString().split("T")[0];
    let existingAmount = "";
    
    if (isEditing && linkedExpense) {
      existingDate = linkedExpense.date ? new Date(linkedExpense.date).toISOString().split("T")[0] : existingDate;
      existingAmount = linkedExpense.amount || "";
    } else if (!isEditing && pendingExpenseData) {
      existingDate = pendingExpenseData.date;
      existingAmount = pendingExpenseData.amount;
    }
    
    setExpenseDate(existingDate);
    
    if (currentStatus === "Partial") {
      // For Partial, show dialog with date + amount
      setPartialExpenseAmount(existingAmount);
      setShowPartialExpenseDialog(true);
    } else if (currentStatus === "Paid") {
      // For Paid, show dialog with only date (amount is auto-set to full payment)
      const fullAmount = form.getValues("payment") as string || "0";
      setPartialExpenseAmount(fullAmount);
      setShowPartialExpenseDialog(true);
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (newStatus: string) => {
    const oldStatus = previousPaymentStatus;
    const hasLinkedExpense = isEditing ? !!linkedExpenseId : !!pendingExpenseData;
    
    // If changing to Pending and there's a linked expense, show confirmation
    if (newStatus === "Pending" && hasLinkedExpense) {
      setShowPendingConfirmDialog(true);
      return; // Don't change status yet, wait for confirmation
    }
    
    // If changing from Partial to Paid and there's a linked expense, update expense to full amount
    if (oldStatus === "Partial" && newStatus === "Paid" && hasLinkedExpense) {
      const fullAmount = form.getValues("payment") as string || "0";
      if (isEditing) {
        await createOrUpdateExpense(fullAmount);
      } else {
        // In Add mode, just update the pending expense data
        setPendingExpenseData(prev => prev ? { ...prev, amount: fullAmount } : null);
      }
    }
    
    // Update the form value
    form.setValue("paymentStatus", newStatus);
    setPreviousPaymentStatus(newStatus);
  };

  // Handle pending confirmation dialog - delete expense and set status to Pending
  const handlePendingConfirm = async () => {
    if (isEditing && linkedExpenseId) {
      // In Edit mode, delete the actual expense
      setIsCreatingExpense(true);
      try {
        await apiRequest("DELETE", `/api/expenses/${linkedExpenseId}`);
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/by-plan", plan?.id] });
        await refetchLinkedExpense();
        toast({
          title: "Expense Deleted",
          description: "The linked expense has been removed",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete expense: " + (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsCreatingExpense(false);
      }
    } else if (!isEditing && pendingExpenseData) {
      // In Add mode, just clear the pending expense data
      setPendingExpenseData(null);
      toast({
        title: "Expense Cleared",
        description: "The pending expense has been removed",
      });
    }
    form.setValue("paymentStatus", "Pending");
    setPreviousPaymentStatus("Pending");
    setShowPendingConfirmDialog(false);
  };

  const handlePendingCancel = () => {
    setShowPendingConfirmDialog(false);
    // Keep the current status
  };

  // Handle delete/unlink expense
  const handleDeleteExpense = async () => {
    if (isEditing) {
      if (!linkedExpenseId) return;
      
      setIsCreatingExpense(true);
      try {
        await apiRequest("DELETE", `/api/expenses/${linkedExpenseId}`);
        
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/by-plan", plan?.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
        await refetchLinkedExpense();
        
        toast({
          title: "Success",
          description: "Expense unlinked and deleted",
        });
        setShowPartialExpenseDialog(false);
        setPartialExpenseAmount("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete expense: " + (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsCreatingExpense(false);
      }
    } else if (!isEditing && pendingExpenseData) {
      // In Add mode, just clear the pending expense data
      setPendingExpenseData(null);
      toast({
        title: "Expense Cleared",
        description: "The pending expense has been removed",
      });
      setShowPartialExpenseDialog(false);
      setPartialExpenseAmount("");
    }
  };

  // Create or update expense linked to fulfillment plan - returns true on success, false on failure
  const createOrUpdateExpense = async (amount: string): Promise<boolean> => {
    if (!plan?.id) {
      toast({
        title: "Error",
        description: "Cannot link expense: plan ID is required",
        variant: "destructive",
      });
      return false;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return false;
    }

    const maxAmount = parseFloat(form.getValues("payment") as string || "0");
    if (numericAmount > maxAmount) {
      toast({
        title: "Error",
        description: `Amount cannot exceed the total payment (₹${maxAmount.toLocaleString("en-IN")})`,
        variant: "destructive",
      });
      return false;
    }

    setIsCreatingExpense(true);
    try {
      const recipientName = getRecipientName();
      const currentStatus = form.getValues("paymentStatus");
      
      if (linkedExpenseId) {
        // EDIT existing expense
        await apiRequest("PATCH", `/api/expenses/${linkedExpenseId}`, {
          amount: amount,
          date: expenseDate,
          description: `Payment to ${recipientName} for ${event?.eventName || "Event"} - ${currentStatus}`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });

        toast({
          title: "Success",
          description: `Expense updated (₹${numericAmount.toLocaleString("en-IN")})`,
        });
      } else {
        // CREATE new expense - NOTE: to_account is null for Debit expenses per user requirement
        const expenseData = {
          type: "Debit",
          category: "Event",
          from_account: "DDC Fund",
          to_account: null,
          description: `DDC Spent for ${event?.eventName || " an Event"}`,
          amount: amount,
          date: expenseDate,
          status: "Paid",
          fulfillmentPlanId: plan.id,
          contributor: [],
          contribution: [],
          contribution_status: [],
        };

        const res = await apiRequest("POST", "/api/expenses", expenseData);
        const createdExpense = await res.json();

        // Refetch linked expense query so subsequent clicks will EDIT, not CREATE
        await refetchLinkedExpense();

        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/by-plan", plan.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });

        toast({
          title: "Success",
          description: `Expense created and linked (₹${numericAmount.toLocaleString("en-IN")})`,
        });
      }
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link expense: " + (error as Error).message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCreatingExpense(false);
    }
  };

  // Handle partial expense dialog confirmation
  const handlePartialExpenseConfirm = async () => {
    const currentPaymentStatus = form.getValues("paymentStatus");
    const fullPaymentAmount = form.getValues("payment") as string || "0";
    
    // For "Paid" status, use the full payment amount (fallback if partialExpenseAmount not set)
    const amountToUse = currentPaymentStatus === "Paid" 
      ? fullPaymentAmount 
      : partialExpenseAmount;
    
    if (!amountToUse) {
      toast({
        title: "Error",
        description: "No amount specified for the expense",
        variant: "destructive",
      });
      return;
    }
    
    const numericAmount = parseFloat(amountToUse);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    const maxAmount = parseFloat(fullPaymentAmount);
    if (numericAmount > maxAmount) {
      toast({
        title: "Error",
        description: `Amount cannot exceed the total payment (₹${maxAmount.toLocaleString("en-IN")})`,
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing && plan?.id) {
      // Edit mode - actually create/update expense in database
      const success = await createOrUpdateExpense(amountToUse);
      if (success) {
        // Auto-update status to Paid if partial amount equals payment amount
        if (form.getValues("paymentStatus") === "Partial" && numericAmount >= maxAmount) {
          form.setValue("paymentStatus", "Paid");
          setPreviousPaymentStatus("Paid");
          toast({
            title: "Status Updated",
            description: "Payment status changed to Paid as full amount is paid",
          });
        }
        setShowPartialExpenseDialog(false);
        setPartialExpenseAmount("");
      }
      // If failed, dialog stays open for retry
    } else {
      // Add mode - store pending expense data to be created after plan is saved
      setPendingExpenseData({
        amount: amountToUse,
        date: expenseDate,
      });
      
      // Auto-update status to Paid if partial amount equals payment amount
      if (form.getValues("paymentStatus") === "Partial" && numericAmount >= maxAmount) {
        form.setValue("paymentStatus", "Paid");
        setPreviousPaymentStatus("Paid");
      }
      
      toast({
        title: "Expense Prepared",
        description: `Expense of ₹${numericAmount.toLocaleString("en-IN")} will be created when you save the plan`,
      });
      setShowPartialExpenseDialog(false);
      setPartialExpenseAmount("");
    }
  };

  const handlePartialExpenseCancel = () => {
    setShowPartialExpenseDialog(false);
    setPartialExpenseAmount("");
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertFulfillmentPlan) => {
      const res = await apiRequest("POST", "/api/plans", data);
      return res.json();
    },
    onSuccess: async (createdPlan: FulfillmentPlan) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirementId, "plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      
      // Store pending expense data before clearing it
      const expenseToCreate = pendingExpenseData;
      const originalStatus = form.getValues("paymentStatus");
      
      // Clear pending expense data immediately to prevent duplicate submissions
      setPendingExpenseData(null);
      
      // If there's pending expense data, create the expense now
      if (expenseToCreate && createdPlan.id) {
        try {
          // First check if an expense already exists for this plan (safety check)
          const existingExpenseRes = await fetch(`/api/expenses/by-plan/${createdPlan.id}`);
          if (existingExpenseRes.ok) {
            // Expense already exists, skip creation
            toast({
              title: "Success",
              description: "Plan created. Expense was already linked.",
            });
          } else {
            // No existing expense, create new one
            const expenseData = {
              type: "Debit",
              category: "Event",
              from_account: "DDC Fund",
              to_account: null,
              description: `DDC Spent for ${event?.eventName || " an Event"}`,
              amount: expenseToCreate.amount,
              date: expenseToCreate.date,
              status: "Paid",
              fulfillmentPlanId: createdPlan.id,
              contributor: [],
              contribution: [],
              contribution_status: [],
            };
            
            const expenseRes = await apiRequest("POST", "/api/expenses", expenseData);
            
            // Handle 409 conflict (expense already exists)
            if (!expenseRes.ok && expenseRes.status === 409) {
              toast({
                title: "Success",
                description: "Plan created. An expense was already linked.",
              });
            } else {
              queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
              queryClient.invalidateQueries({ queryKey: ["/api/expenses/by-plan", createdPlan.id] });
              
              toast({
                title: "Success",
                description: `Plan created and expense of ₹${parseFloat(expenseToCreate.amount).toLocaleString("en-IN")} linked`,
              });
            }
          }
        } catch (error) {
          // Expense creation failed - notify user with actionable guidance
          toast({
            title: "Plan Created - Expense Failed",
            description: "Plan saved successfully. Please edit the plan to add the expense manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Fulfillment plan created successfully",
        });
      }
      
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
                    <div className="flex items-center gap-2">
                      <FormLabel>Payment Status</FormLabel>
                      {(field.value === "Paid" || field.value === "Partial") && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                          onClick={handleLinkExpense}
                          disabled={isCreatingExpense || (isEditing && !isPlanLoaded)}
                          data-testid="button-link-expense"
                        >
                          {isCreatingExpense ? "Linking..." : 
                           isEditing ? (linkedExpenseId ? "View Linked Expense" : "Link Expense") :
                           (pendingExpenseData ? "Edit Pending Expense" : "Prepare Expense")}
                        </button>
                      )}
                    </div>
                    <Select 
                      onValueChange={(value) => handlePaymentStatusChange(value)} 
                      value={field.value || "Pending"}
                      disabled={isCreatingExpense}
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
                    {validationWarning && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{validationWarning}</p>
                    )}
                    {!isEditing && pendingExpenseData && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Expense of ₹{parseFloat(pendingExpenseData.amount).toLocaleString("en-IN")} will be created on save
                      </p>
                    )}
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
                    <div className="flex items-center gap-2">
                      <FormLabel>Payment Status</FormLabel>
                      {(field.value === "Paid" || field.value === "Partial") && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                          onClick={handleLinkExpense}
                          disabled={isCreatingExpense || (isEditing && !isPlanLoaded)}
                          data-testid="button-link-expense"
                        >
                          {isCreatingExpense ? "Linking..." : 
                           isEditing ? (linkedExpenseId ? "View Linked Expense" : "Link Expense") :
                           (pendingExpenseData ? "Edit Pending Expense" : "Prepare Expense")}
                        </button>
                      )}
                    </div>
                    <Select 
                      onValueChange={(value) => handlePaymentStatusChange(value)} 
                      value={field.value || "Pending"}
                      disabled={isCreatingExpense}
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
                    {validationWarning && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{validationWarning}</p>
                    )}
                    {!isEditing && pendingExpenseData && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Expense of ₹{parseFloat(pendingExpenseData.amount).toLocaleString("en-IN")} will be created on save
                      </p>
                    )}
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

      {/* Pending Status Confirmation Dialog */}
      <AlertDialog open={showPendingConfirmDialog} onOpenChange={setShowPendingConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change to Pending Status</AlertDialogTitle>
            <AlertDialogDescription>
              Expense record will be deleted if the payment status is changed to Pending. If you want, you can choose Partial to provide partial payment.
              <br /><br />
              Are you sure you want to continue? This will remove the expense linking also.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePendingCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePendingConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Expense Dialog */}
      <Dialog open={showPartialExpenseDialog} onOpenChange={setShowPartialExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {linkedExpenseId ? "Edit Payment Record" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {form.getValues("paymentStatus") === "Partial" 
                ? `Enter the partial payment amount and date. This will create/update an expense transaction (Debit: DDC Fund to ${getRecipientName()}).`
                : `Confirm the payment date. This will create/update an expense transaction for the full payment amount (Debit: DDC Fund to ${getRecipientName()}).`}
            </p>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Payment Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                data-testid="input-expense-date"
              />
            </div>
            {form.getValues("paymentStatus") === "Partial" && (
              <div className="space-y-2">
                <Label htmlFor="partial-plan-amount">Amount Paid</Label>
                <Input
                  id="partial-plan-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={parseFloat(form.getValues("payment") as string || "0")}
                  value={partialExpenseAmount}
                  onChange={(e) => setPartialExpenseAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  data-testid="input-partial-plan-expense-amount"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: ₹{parseFloat(form.getValues("payment") as string || "0").toLocaleString("en-IN")}
                </p>
              </div>
            )}
            {form.getValues("paymentStatus") === "Paid" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Amount:</span> ₹{parseFloat(form.getValues("payment") as string || "0").toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {linkedExpenseId && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteExpense}
                disabled={isCreatingExpense}
                className="sm:mr-auto"
                data-testid="button-delete-expense"
              >
                Delete Expense
              </Button>
            )}
            <Button variant="outline" onClick={handlePartialExpenseCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handlePartialExpenseConfirm} 
              disabled={
                isCreatingExpense || 
                (form.getValues("paymentStatus") === "Partial" 
                  ? (!partialExpenseAmount || parseFloat(partialExpenseAmount) <= 0)
                  : parseFloat(form.getValues("payment") as string || "0") <= 0)
              }
              data-testid="button-save-expense"
            >
              {isCreatingExpense ? "Saving..." : linkedExpenseId ? "Update Expense" : "Create Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
