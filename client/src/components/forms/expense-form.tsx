// @ts-ignore - Console is a global object in browsers
declare const console: Console;

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

// -------------------- Schema --------------------
const expenseFormSchema = z.object({
  date: z.string(),
  type: z.string(),
  fromAccount: z.string(),
  description: z.union([z.string(), z.null()]).optional(),
  amount: z.string(),
  contributor: z.array(z.string()),
  contribution: z.array(z.number()),
  contributionStatus: z.array(z.string()),
  category: z.union([z.string(), z.null()]).optional(),
  toAccount: z.union([z.string(), z.null()]).optional(),
  status: z.string().optional(),
  splitEnabled: z.boolean(),
  splitType: z.enum(['from', 'to', 'both']).optional(),
  eventId: z.string().optional().nullable(),
}).refine(data => {
  // If split is enabled, splitType must be selected
  if (data.splitEnabled && !data.splitType) {
    return false;
  }
  return true;
}, {
  message: 'Please select a split option',
  path: ['splitType']
}).refine(data => {
  // If split is enabled, contribution details are required
  if (data.splitEnabled && data.splitType) {
    const totalContribution = data.contribution.reduce((sum, amount) => sum + amount, 0);
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) || 0 : data.amount;
    
    // Check if we have contributors and the total matches the amount
    if (data.contributor.length === 0 || data.contribution.length === 0) {
      return false;
    }
    
    // For 'both' split type, we need to check if the total is exactly the amount
    // For 'from' or 'to', the total should not exceed the amount
    if (data.splitType === 'both') {
      return Math.abs(totalContribution - amount) < 0.01; // Allow for floating point precision
    }
    
    return totalContribution <= amount + 0.01; // Allow for floating point precision
  }
  return true;
}, {
  message: 'Please add at least one contributor with a valid contribution amount',
  path: ['contributor']
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

// Type for the API payload that matches the server's expectations
interface ExpenseApiPayload {
  // Frontend fields (camelCase)
  type: string;
  date: string;
  fromAccount: string;
  toAccount: string | null;
  description?: string | null;
  amount: string | number;
  category?: string | null;
  status?: string;
  splitTo?: string;
  contributor?: string[];
  contribution?: number[];
  contributionStatus?: string[];
  splitType?: 'from' | 'to' | 'both' | null;
  splitEnabled?: boolean;
  eventId?: string | null;
  
  // Backend fields (snake_case, for API compatibility)
  from_account?: string;
  to_account?: string | null;
  contribution_status?: string[];
  split_to?: string;
  split_type?: 'from' | 'to' | 'both' | null;
  split_enabled?: boolean;
}

interface ExpenseFormProps {
  expense?: ExpenseFormData & { id?: string; eventId?: string | null };
  onSuccess?: () => void;
  eventId?: string;
}

interface TeamMember {
  id: string;
  name: string;
}

interface Configuration {
  id: string;
  expenseCategories: string[];
  paymentStatuses: string[];
}

// -------------------- Component --------------------
export function ExpenseForm({ expense, onSuccess, eventId }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showToAccountCustomInput, setShowToAccountCustomInput] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toAccountInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!expense;

  const { data: config } = useQuery<Configuration>({
    queryKey: ["configuration"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/configuration");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch team members with retry and refetch on window focus
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/team");
        if (!res.ok) throw new Error('Failed to fetch team members');
        const data = await res.json();
        return data;
      } catch (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  const contributorsRef = useRef<
    Array<{ id: string; teamMember: string; amount: string; status: string }>
  >([]);

  const [_, forceUpdate] = useState({});

  // Initialize accordion state when expense changes
  useEffect(() => {
    if (expense?.splitEnabled) {
      setIsAccordionOpen(true);
      // Initialize contributors from expense data if it exists
      if (expense.contributor && expense.contribution && expense.contributionStatus) {
        contributorsRef.current = expense.contributor.map((contributor, index) => ({
          id: `contributor-${index}`,
          teamMember: contributor,
          amount: String(expense.contribution?.[index] || ''),
          status: expense.contributionStatus?.[index] || 'pending'
        }));
      }
    }
  }, [expense]);

  // -------------------- Form --------------------
  // Define the form type based on the schema
  type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
  
  // Helper function to get value with fallback between camelCase and snake_case
  const getValue = <T,>(obj: any, key: string, defaultValue: T): T => {
    if (!obj) return defaultValue;
    const camelKey = key;
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    return obj[camelKey] !== undefined ? obj[camelKey] : 
           obj[snakeKey] !== undefined ? obj[snakeKey] : 
           defaultValue;
  };

  // Memoize formValues to prevent unnecessary recalculations
  const formValues = useMemo(() => {
    const defaultValues = {
      type: 'Expense',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      status: 'Paid',
      fromAccount: 'DDC Fund',
      toAccount: null as string | null,
      splitEnabled: false,
      splitType: undefined as 'from' | 'to' | 'both' | undefined,
      contributor: [] as string[],
      contribution: [] as number[],
      contributionStatus: [] as string[],
      eventId: eventId ?? null,
    };

    if (!expense) return defaultValues;

    // Create form values with proper fallbacks
    const values = {
      type: getValue(expense, 'type', defaultValues.type),
      date: getValue(expense, 'date', defaultValues.date),
      amount: getValue(expense, 'amount', defaultValues.amount),
      category: getValue(expense, 'category', defaultValues.category),
      description: getValue(expense, 'description', defaultValues.description),
      status: getValue(expense, 'status', defaultValues.status),
      fromAccount: getValue(expense, 'fromAccount', defaultValues.fromAccount),
      toAccount: getValue(expense, 'toAccount', defaultValues.toAccount),
      splitEnabled: getValue(expense, 'splitEnabled', defaultValues.splitEnabled),
      splitType: getValue(expense, 'splitType', undefined),
      contributor: Array.isArray(expense.contributor) ? expense.contributor : [],
      contribution: Array.isArray(expense.contribution) 
        ? expense.contribution.map(c => typeof c === 'string' ? parseFloat(c) : c)
        : [],
      contributionStatus: getValue(expense, 'contributionStatus', []),
      eventId: getValue(expense, 'eventId', defaultValues.eventId),
    };
    
    console.log('Computed form values:', values);
    return values;
  }, [expense]);

  // Set up form with proper error handling
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: formValues,
    mode: 'onChange',
  });

  // Track previous form state for debugging
  const prevFormState = useRef(form.formState);
  useEffect(() => {
    if (form.formState !== prevFormState.current) {
      console.log('Form state changed:', {
        values: form.getValues(),
        errors: form.formState.errors,
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
      });
      prevFormState.current = form.formState;
    }
  });

  // Watch for changes and reset form when expense changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Optional: Add any side effects you want to trigger on form value changes
    });
    
    // Reset form when expense changes
    if (expense) {
      console.log('Resetting form with expense data');
      form.reset(formValues);
    }
    
    return () => subscription.unsubscribe();
  }, [expense, form, formValues]);

  // Initialize showToAccountCustomInput based on the initial toAccount value
  useEffect(() => {
    const toAccount = form.getValues('toAccount');
    if (toAccount && toAccount !== 'DDC Fund' && !teamMembers?.some(m => m.name === toAccount)) {
      setShowToAccountCustomInput(true);
    }
  }, [form, teamMembers]);

  const watchSplitEnabled = useWatch({
    control: form.control,
    name: "splitEnabled",
  });

  const watchType = useWatch({
    control: form.control,
    name: 'type',
    defaultValue: form.getValues('type') || ''
  });

  const watchSplitType = useWatch({
    control: form.control,
    name: 'splitType',
  });

  // Reset dependent fields when type changes
  useEffect(() => {
    if (watchType === 'Transfer') {
      if (!form.getValues('toAccount')) {
        form.setValue('toAccount', 'DDC Fund');
      }
    } else if (form.getValues('toAccount') === 'DDC Fund') {
      form.setValue('toAccount', '');
    }
  }, [watchType, form]);

  // Reset and manage account fields when split type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'splitType' || name === 'splitEnabled') {
        if (!value.splitEnabled) {
          // If split is disabled, enable both fields
          form.trigger('fromAccount');
          form.trigger('toAccount');
        } else if (value.splitType === 'from') {
          // If splitting from account, disable fromAccount and enable toAccount
          form.setValue('fromAccount', '');
          form.trigger('fromAccount');
          form.trigger('toAccount');
        } else if (value.splitType === 'to') {
          // If splitting to account, disable toAccount and enable fromAccount
          form.setValue('toAccount', '');
          form.trigger('fromAccount');
          form.trigger('toAccount');
        } else if (value.splitType === 'both') {
          // If splitting both, enable both fields
          form.trigger('fromAccount');
          form.trigger('toAccount');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // -------------------- Contributors Logic --------------------
  const setContributors = useCallback(
    (
      updater: (
        prev: Array<{ id: string; teamMember: string; amount: string; status: string }>
      ) => Array<{ id: string; teamMember: string; amount: string; status: string }>
    ) => {
      const prevContributors = [...contributorsRef.current];
      contributorsRef.current = updater(contributorsRef.current);

      if (form.getValues("splitEnabled")) {
        const total = contributorsRef.current.reduce(
          (sum, c) => sum + (parseFloat(c.amount) || 0),
          0
        );
        form.setValue("amount", total > 0 ? total.toFixed(2) : "");
        form.setValue("contributor", contributorsRef.current.map((c) => c.teamMember));
        form.setValue("contribution", contributorsRef.current.map((c) => parseFloat(c.amount) || 0));
        form.setValue("contributionStatus", contributorsRef.current.map((c) => c.status));
      }

      if (JSON.stringify(prevContributors) !== JSON.stringify(contributorsRef.current)) {
        forceUpdate({});
      }
    },
    [form]
  );

  const addContributor = useCallback(() => {
    setContributors((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        teamMember: "",
        amount: "",
        status: "Pending",
      },
    ]);
    
    // Enable split when adding a contributor
    form.setValue("splitEnabled", true);
    if (!isAccordionOpen) setIsAccordionOpen(true);
  }, [isAccordionOpen, form]);

  const updateContributor = (id: string, field: string, value: string) => {
    setContributors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContributor = (id: string) => {
    setContributors((prev) => prev.filter((c) => c.id !== id));
  };

  // Effect to handle initial data loading and team members sync
  useEffect(() => {
    console.log('=== EXPENSE FORM DATA LOADING STARTED ===');
    console.log('Expense data received in form:', JSON.stringify(expense, null, 2));
    console.log('Team members loading state:', { isLoadingTeamMembers, teamMembersCount: teamMembers?.length });
    
    // If team members are still loading, wait for them
    if (isLoadingTeamMembers || !teamMembers?.length) {
      return;
    }
    
    if (expense) {
      console.log('Processing expense data for form:', {
        hasContributors: !!expense.contributor?.length,
        contributorCount: expense.contributor?.length || 0,
        contributors: expense.contributor,
        contributions: expense.contribution,
        contributionStatuses: expense.contributionStatus,
        expenseId: expense.id,
        expenseType: expense.type,
        expenseAmount: expense.amount,
        expenseDate: expense.date,
        fromAccount: expense.fromAccount,
        toAccount: expense.toAccount,
        description: expense.description,
        category: expense.category,
        splitEnabled: expense.splitEnabled,
        splitType: expense.splitType,
        contributor: expense.contributor,
        contribution: expense.contribution,
        contributionStatus: expense.contributionStatus,
      });

      if (expense.contributor?.length) {
        
        // Get all team members to map IDs to names
        const teamMembersMap = new Map(
          teamMembers?.map(member => [member.id, member.name]) || []
        );
        
        // Create a map of team member names to their objects for easier lookup
        const teamMemberMap = new Map(teamMembers?.map(m => [m.name, m]));
        
        const initialContributors = expense.contributor.map((memberId, i) => {          
          // Try to find the team member by ID first, then by name as fallback
          const teamMember = teamMembers?.find(m => m.id === memberId || m.name === memberId);
          const memberName = teamMember?.name || memberId;
          
          const contributionAmount = expense.contribution?.[i];
          const contributionStatus = expense.contributionStatus?.[i] || "Pending";
          const contributor = {
            id: `contributor-${i}-${Date.now()}`,
            teamMember: memberName,
            amount: contributionAmount?.toString() || "0",
            status: contributionStatus,
          };
          
          return contributor;
        });
        // Log the values that will be set in the form
        const contributorValues = initialContributors.map((c) => c.teamMember);
        const contributionValues = initialContributors.map((c) => parseFloat(c.amount) || 0);
        const statusValues = initialContributors.map((c) => c.status);
        
        // Update the ref first
        contributorsRef.current = initialContributors;
        
        // Then update the form values
        console.log('Setting form values...');
        form.setValue("splitEnabled", true);
        form.setValue("contributor", contributorValues);
        form.setValue("contribution", contributionValues);
        form.setValue("contributionStatus", statusValues);
        
        // Verify the values were set correctly
        console.log('Form values after setting:', {
          contributor: form.getValues('contributor'),
          contribution: form.getValues('contribution'),
          contributionStatus: form.getValues('contributionStatus')
        });
        
        const total = initialContributors.reduce(
          (sum, c) => sum + (parseFloat(c.amount) || 0),
          0
        );
        console.log('Calculated total amount from contributors:', total);
        form.setValue("amount", total.toFixed(2));
        
        console.log('Form values after setting contributors:', {
          contributor: form.getValues('contributor'),
          contribution: form.getValues('contribution'),
          contributionStatus: form.getValues('contributionStatus'),
          amount: form.getValues('amount')
        });
        
        // Force the accordion to open when there are contributors
        if (!isAccordionOpen) {
          console.log('Opening contributors accordion');
          setIsAccordionOpen(true);
        }
        
        forceUpdate({});
      } else {
        console.log('No contributors found in expense data');
        form.setValue("splitEnabled", false);
      }
    }
  }, [expense]);

  // ---------- 🔥 FIXED useEffect block ----------
  useEffect(() => {
    if (expense) {
      console.log("Computed form values:", form.getValues());
      console.log("Resetting form with expense data");

      console.log("=== EXPENSE FORM DATA LOADING STARTED ===");
      console.log("Expense data received in form:", expense);
      console.log("Team members loading state:", {
        isLoadingTeamMembers: !teamMembers,
        teamMembersCount: teamMembers?.length || 0,
      });

      const normalizedExpense = {
        ...expense,
        fromAccount: expense.fromAccount || expense.fromAccount || "",
        toAccount: expense.toAccount || expense.toAccount || "",
        contributionStatus:
          expense.contributionStatus || expense.contributionStatus || [],
      };

      console.log("Processing expense data for form:", {
        hasContributors: normalizedExpense.contributor?.length > 0,
        contributorCount: normalizedExpense.contributor?.length || 0,
        contributors: normalizedExpense.contributor || [],
        contributions: normalizedExpense.contribution || [],
        contributionStatuses: normalizedExpense.contributionStatus || [],
      });

      form.reset(normalizedExpense);

      if (!normalizedExpense.contributor?.length) {
        console.log("No contributors found in expense data");
      }
    }
  }, [expense, teamMembers]);
  // ---------- 🔥 FIX END ----------

  useEffect(() => {
    if (!watchSplitEnabled) {
      contributorsRef.current = [];
      form.setValue("contributor", []);
      form.setValue("contribution", []);
      form.setValue("contributionStatus", []);
      forceUpdate({});
    } else if (contributorsRef.current.length === 0) {
      addContributor();
    }
  }, [watchSplitEnabled]);

  // Memoize the team members and log any changes
  const availableTeamMembers = useMemo(() => {
    // Ensure we always return an array
    const members = Array.isArray(teamMembers) ? teamMembers : [];
    return members;
  }, [teamMembers]);

  // Effect to handle team members updates
  useEffect(() => {
    if (availableTeamMembers.length > 0 && expense?.contributor?.length) {
      
      // Process contributors with the now-available team members
      const initialContributors = expense.contributor.map((memberId, i) => {
        const teamMember = availableTeamMembers.find(m => m.name === memberId);
        return {
          id: `contributor-${i}-${Date.now()}`,
          teamMember: memberId,
          amount: expense.contribution?.[i]?.toString() || "0",
          status: expense.contributionStatus?.[i] || "Pending",
        };
      });
      contributorsRef.current = initialContributors;
      
      // Update form values
      form.setValue("splitEnabled", true);
      form.setValue("contributor", initialContributors.map(c => c.teamMember));
      form.setValue("contribution", initialContributors.map(c => parseFloat(c.amount) || 0));
      form.setValue("contributionStatus", initialContributors.map(c => c.status));
      
      // Force a re-render
      forceUpdate({});
    }
  }, [availableTeamMembers, expense]);

  // -------------------- Mutations --------------------
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseApiPayload) => {
      try {
        const res = await apiRequest("POST", "/api/expenses", data);
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to create expense');
        }
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account-balance"] });
      toast({ title: "Success", description: "Expense created successfully" });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Create mutation error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: error.message || "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseApiPayload) => {
      if (!expense?.id) throw new Error("Expense ID is required");
      try {
        const res = await apiRequest("PATCH", `/api/expenses/${expense.id}`, data);
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to update expense');
        }
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account-balance"] });
      toast({ title: "Success", description: "Expense updated successfully" });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Update mutation error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  // Prepare API payload with correct field names
  const prepareApiPayload = (data: ExpenseFormData): ExpenseApiPayload => {
    // Create the payload with both camelCase and snake_case fields
    const payload: ExpenseApiPayload = {
      // Frontend fields (camelCase)
      type: data.type,
      date: data.date,
      fromAccount: data.fromAccount,
      toAccount: data.toAccount || null,
      // Ensure amount is sent as a string to match server expectations
      amount: String(data.amount || '0'),
      category: data.category || null,
      description: data.description || null,
      status: data.status || "Paid",
      splitType: data.splitEnabled ? data.splitType || null : null,
      splitEnabled: data.splitEnabled || false,
      contributor: data.splitEnabled ? data.contributor || [] : [],
      contribution: data.splitEnabled ? data.contribution?.map(Number) || [] : [],
      contributionStatus: data.splitEnabled ? (data.contributionStatus || []) : [],
      eventId: data.eventId ?? eventId ?? null,
      
      // Backend fields (snake_case)
      from_account: data.fromAccount,
      to_account: data.toAccount || null,
      contribution_status: data.splitEnabled ? (data.contributionStatus || []) : [],
      split_type: data.splitEnabled ? data.splitType || null : null,
      split_enabled: data.splitEnabled || false,
    };

    return payload;
  };

  // -------------------- onSubmit --------------------
  const validateFormBeforeSubmit = (data: ExpenseFormData): { valid: boolean; message?: string } => {
    // Check account fields based on split type
    if (data.splitEnabled && data.splitType) {
      if (data.splitType === 'from' && !data.toAccount) {
        return { valid: false, message: 'Please select a valid "To Account" for this split type' };
      }
      
      if (data.splitType === 'to' && !data.fromAccount) {
        return { valid: false, message: 'Please select a valid "From Account" for this split type' };
      }
      
      if (data.splitType === 'both' && (!data.fromAccount || !data.toAccount)) {
        return { valid: false, message: 'Please select both "From Account" and "To Account" for this split type' };
      }
    }
    
    return { valid: true };
  };

  const onSubmit = async (formData: ExpenseFormData) => {
    // Prevent multiple submissions
    if (isPending) return;
    
    // Set pending state
    setIsPending(true);
    
    // Validate form state before submission
    const validation = validateFormBeforeSubmit(formData);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.message || 'Please check your form inputs',
        variant: 'destructive',
      });
      setIsPending(false);
      return;
    }
    
    try {
      // Additional validation for split amounts
      if (formData.splitEnabled && formData.splitType) {
        const hasContributors = contributorsRef.current.length > 0;
        const totalContribution = hasContributors 
          ? contributorsRef.current.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
          : 0;
          
        const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount;
        
        // Validate contributors exist for split
        if (!hasContributors) {
          toast({
            title: 'Invalid Split',
            description: 'Please add at least one contributor for the split',
            variant: 'destructive',
          });
          return;
        }
        
        // Validate contribution amounts
        if (totalContribution <= 0) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount must be greater than zero',
            variant: 'destructive',
          });
          return;
        }
        
        // For 'both' split type, total must exactly match the amount
        // For 'from' or 'to', total should not exceed the amount
        if (formData.splitType === 'both' && Math.abs(totalContribution - amount) > 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount must exactly match the transaction amount for this split type',
            variant: 'destructive',
          });
          return;
        } else if (formData.splitType !== 'both' && totalContribution > amount + 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount cannot exceed the transaction amount',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Process contributors if split is enabled
      const hasContributors = contributorsRef.current.length > 0;
      const totalContribution = hasContributors 
        ? contributorsRef.current.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
        : 0;
      const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount;
      
      // Double-check account fields based on split type
      if (formData.splitEnabled && formData.splitType) {
        if (formData.splitType === 'from' && !formData.toAccount) {
          throw new Error('To Account is required for this split type');
        }
        if (formData.splitType === 'to' && !formData.fromAccount) {
          throw new Error('From Account is required for this split type');
        }
        if (formData.splitType === 'both' && (!formData.fromAccount || !formData.toAccount)) {
          throw new Error('Both accounts are required for this split type');
        }
      }
      
      // Process contributors if split is enabled
      const shouldProcessContributors = formData.splitEnabled && formData.splitType && hasContributors;
          
      // Prepare the API payload
      const apiPayload = prepareApiPayload(formData);
      
      // Process contributors if needed
      if (shouldProcessContributors) {
        apiPayload.contributor = contributorsRef.current.map((c) => c.teamMember);
        apiPayload.contribution = contributorsRef.current.map((c) => parseFloat(c.amount) || 0);
        apiPayload.contribution_status = contributorsRef.current.map((c) => c.status);
        
        // Set the split_to field based on splitType
        if (formData.splitType === 'to') {
          apiPayload.split_to = formData.toAccount || '';
        } else if (formData.splitType === 'from') {
          apiPayload.split_to = formData.fromAccount || '';
        }
      } else {
        // Clear contributor data if not splitting
        apiPayload.contributor = [];
        apiPayload.contribution = [];
        apiPayload.contribution_status = [];
        apiPayload.split_to = '';
      }
      
      // Validate contribution amounts if split is enabled
      if (formData.splitEnabled && formData.splitType) {
        if (totalContribution <= 0) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount must be greater than zero',
            variant: 'destructive',
          });
          return;
        }
        
        // For 'both' split type, total must exactly match the amount
        // For 'from' or 'to', total should not exceed the amount
        if (formData.splitType === 'both' && Math.abs(totalContribution - amount) > 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount must exactly match the transaction amount for this split type',
            variant: 'destructive',
          });
          return;
        } else if (formData.splitType !== 'both' && totalContribution > amount + 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'Total contribution amount cannot exceed the transaction amount',
            variant: 'destructive',
          });
          return;
        }
      }

      // Call the appropriate mutation based on whether we're creating or updating
      try {
        if (expense?.id) {
          await updateMutation.mutateAsync(apiPayload);
          toast({
            title: 'Success',
            description: 'Expense updated successfully',
          });
        } else {
          await createMutation.mutateAsync(apiPayload);
          toast({
            title: 'Success',
            description: 'Expense created successfully',
          });
        }

        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Invalidate the expenses query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      } catch (error) {
        console.error('Error saving expense:', error);
        throw error; // This will be caught by the outer try-catch
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset pending state
      setIsPending(false);
    }
};


  // -------------------- UI --------------------
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Row 1: Transaction Type | Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {config?.expenseCategories?.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: From | To Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From Account */}
          <FormField
            control={form.control}
            name="fromAccount"
              render={({ field }) => {
                const teamMembersWithFund = [
                  ...(teamMembers || []),
                  { id: 'ddc-fund', name: 'DDC Fund' }
                ];
                
                const isCustomValue = field.value && !teamMembersWithFund.some(member => member.name === field.value);
                
                useEffect(() => {
                  if (showCustomInput && inputRef.current) {
                    inputRef.current.focus();
                  }
                }, [showCustomInput, field.value]);
              
                return (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    {!showCustomInput && !isCustomValue ? (
                      <div className="flex gap-2">
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setShowCustomInput(true);
                              field.onChange('DDC Fund');
                            } else {
                              field.onChange(value);
                            }
                          }}
                          disabled={watchSplitType === 'from'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teamMembersWithFund.map((member) => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">+ Add custom name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          ref={inputRef}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Enter name"
                          className="w-full"
                          onBlur={() => {
                            if (!field.value) {
                              setShowCustomInput(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            field.onChange('');
                            setShowCustomInput(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* To Account */}
            <FormField
              control={form.control}
              name="toAccount"
              render={({ field }) => {
                const teamMembersWithFund = [
                  ...(teamMembers || []),
                  { id: 'ddc-fund', name: 'DDC Fund' }
                ];
                
                const isCustomValue = field.value && !teamMembersWithFund.some(member => member.name === field.value);
                
                useEffect(() => {
                  if (showToAccountCustomInput && toAccountInputRef.current) {
                    toAccountInputRef.current.focus();
                    console.log('To Account field value:', field.value);
                  }
                }, [showToAccountCustomInput, field.value]);
                
                return (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    {!showToAccountCustomInput && !isCustomValue ? (
                      <div className="flex gap-2">
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setShowToAccountCustomInput(true);
                              field.onChange('DDC Fund');
                            } else {
                              field.onChange(value || null);
                            }
                          }}
                          disabled={watchSplitType === 'to'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teamMembersWithFund.map((member) => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">+ Add custom name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          ref={toAccountInputRef}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Enter name"
                          className="w-full"
                          onBlur={() => {
                            if (!field.value) {
                              setShowToAccountCustomInput(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            field.onChange('');
                            setShowToAccountCustomInput(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
        </div>

        {/* Row 4: Split Section */}
        <div className="pt-2">
          <Accordion
            type="single"
            collapsible
            value={isAccordionOpen ? "split-expense" : undefined}
            onValueChange={(v) => {
              setIsAccordionOpen(v === "split-expense");
              if (v !== "split-expense") {
                form.setValue('splitEnabled', false);
                form.setValue('splitType', undefined);
                form.setValue('contributor', []);
                form.setValue('contribution', []);
                form.setValue('contributionStatus', []);
              } else {
                form.setValue('splitEnabled', true);
              }
            }}
          >
          <AccordionItem value="split-expense">
            <div className="flex items-center justify-between">
              <AccordionTrigger>Want to split amount?</AccordionTrigger>
              <div className="flex-1 max-w-xs ml-4">
                <FormField
                  control={form.control}
                  name="splitType"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'both') {
                            // Clear all split-related data
                            form.setValue('splitEnabled', false);
                            form.setValue('splitType', undefined);
                            form.setValue('contributor', []);
                            form.setValue('contribution', []);
                            form.setValue('contributionStatus', []);
                            setIsAccordionOpen(false);
                          } else {
                            // For 'from' or 'to', update the split type and enable split
                            form.setValue('splitEnabled', true);
                            field.onChange(value);
                            
                            // Clear the corresponding account field
                            if (value === 'from') {
                              form.setValue('fromAccount', '');
                            } else if (value === 'to') {
                              form.setValue('toAccount', '');
                            }
                            
                            // Reset contributions when split type changes
                            form.setValue('contributor', []);
                            form.setValue('contribution', []);
                            form.setValue('contributionStatus', []);
                            // Ensure accordion is open when selecting a split type
                            setIsAccordionOpen(true);
                          }
                        }}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select split option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="from">From Account</SelectItem>
                          <SelectItem value="to">To Account</SelectItem>
                          <SelectItem value="both">Clear</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <AccordionContent className="space-y-4 pt-4">
              {contributorsRef.current.map((contributor) => (
                <div key={contributor.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <FormLabel>Team Member</FormLabel>
                    <Select
                      value={contributor.teamMember}
                      onValueChange={(v) => updateContributor(contributor.id, "teamMember", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          ...(teamMembers || []),
                          { id: 'ddc-fund', name: 'DDC Fund' }
                        ].map((m) => (
                          <SelectItem key={m.id} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <FormLabel>Amount</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={contributor.amount}
                      onChange={(e) => updateContributor(contributor.id, "amount", e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                  <div className="col-span-3">
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={contributor.status}
                      onValueChange={(v) => updateContributor(contributor.id, "status", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {config?.paymentStatuses?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeContributor(contributor.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = Date.now().toString();
                    setContributors((prev) => [
                      ...prev,
                      { id: newId, teamMember: "", amount: "", status: "pending" },
                    ]);
                  }}
                  disabled={!form.watch('splitEnabled') || !form.watch('splitType')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Contributor
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          </Accordion>
        </div>

        {/* Row 4: Amount | Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter amount"
                    disabled={contributorsRef.current.length > 0}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                {contributorsRef.current.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Amount is auto-calculated from contributions
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder="Enter description" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 5: Date | Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date" 
                    className="dark:text-white dark:[color-scheme:dark]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Transaction" : "Create Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}