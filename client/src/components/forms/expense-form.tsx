import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  paidBy: z.string(),
  description: z.string(),
  amount: z.union([z.string(), z.number()]),
  contributor: z.array(z.string()),
  contribution: z.array(z.number()),
  contribution_status: z.array(z.string()),
  category: z.union([z.string(), z.null()]).optional(),
  mode: z.union([z.string(), z.null()]).optional(),
  status: z.string().optional(),
  splitEnabled: z.boolean(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

// Type for the API payload that matches the server's expectations
type ExpenseApiPayload = Omit<ExpenseFormData, 'splitEnabled' | 'paidBy'> & {
  paid_by: string;
};

interface ExpenseFormProps {
  expense?: ExpenseFormData & { id?: string };
  onSuccess?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
}

interface Configuration {
  id: string;
  expenseCategories: string[];
  paymentModes: string[];
  paymentStatuses: string[];
}

// -------------------- Component --------------------
export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
      console.log('Fetching team members...');
      try {
        const res = await apiRequest("GET", "/api/team");
        if (!res.ok) throw new Error('Failed to fetch team members');
        const data = await res.json();
        console.log('Team members fetched:', data);
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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // -------------------- Form --------------------
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type: expense?.type || "Debit",
      description: expense?.description || "",
      category: expense?.category || null,
      amount: expense?.amount || "",
      mode: expense?.mode || null,
      date: expense?.date || format(new Date(), "yyyy-MM-dd"),
      status: expense?.status || "Pending",
      paidBy: expense?.paidBy || "",
      contributor: expense?.contributor || [],
      contribution: expense?.contribution || [],
      contribution_status: expense?.contribution_status || [],
      splitEnabled: false,
    },
  });

  const watchSplitEnabled = useWatch({
    control: form.control,
    name: "splitEnabled",
    defaultValue: false,
  });

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
        form.setValue("contribution_status", contributorsRef.current.map((c) => c.status));
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
      console.log('Waiting for team members to load...');
      return;
    }
    
    if (expense) {
      console.log('Team members data:', JSON.stringify(teamMembers, null, 2));
      
      console.log('Processing expense data for form:', {
        hasContributors: !!expense.contributor?.length,
        contributorCount: expense.contributor?.length || 0,
        contributors: expense.contributor,
        contributions: expense.contribution,
        contributionStatuses: expense.contribution_status,
        expenseId: expense.id,
        expenseType: expense.type,
        expenseAmount: expense.amount,
        expenseDate: expense.date
      });
      
      // Log the raw arrays for comparison
      console.log('Raw contributor array:', expense.contributor);
      console.log('Raw contribution array:', expense.contribution);
      console.log('Raw contribution_status array:', expense.contribution_status);

      if (expense.contributor?.length) {
        console.log('Found contributors in expense data, initializing form...');
        
        // Get all team members to map IDs to names
        const teamMembersMap = new Map(
          teamMembers?.map(member => [member.id, member.name]) || []
        );
        
        console.log('Team members map:', Object.fromEntries(teamMembersMap));
        
        // Create a map of team member names to their objects for easier lookup
        const teamMemberMap = new Map(teamMembers?.map(m => [m.name, m]));
        console.log('Team member map:', Object.fromEntries(teamMemberMap));
        
        const initialContributors = expense.contributor.map((memberId, i) => {
          console.log(`\nProcessing contributor at index ${i}:`);
          console.log('- Member ID/Name:', memberId);
          console.log('- Available team members:', teamMembers);
          
          // Try to find the team member by ID first, then by name as fallback
          const teamMember = teamMembers?.find(m => m.id === memberId || m.name === memberId);
          const memberName = teamMember?.name || memberId;
          
          const contributionAmount = expense.contribution?.[i];
          const contributionStatus = expense.contribution_status?.[i] || "Pending";
          
          console.log(`- Found team member:`, teamMember);
          console.log(`- Using name: ${memberName}`);
          console.log(`- Contribution amount: ${contributionAmount}`);
          console.log(`- Contribution status: ${contributionStatus}`);
          
          const contributor = {
            id: `contributor-${i}-${Date.now()}`,
            teamMember: memberName,
            amount: contributionAmount?.toString() || "0",
            status: contributionStatus,
          };
          
          console.log(`- Created contributor object:`, contributor);
          return contributor;
        });

        console.log('\n=== SETTING UP CONTRIBUTORS ===');
        console.log('Initial contributors data:', JSON.stringify(initialContributors, null, 2));
        
        // Log the values that will be set in the form
        const contributorValues = initialContributors.map((c) => c.teamMember);
        const contributionValues = initialContributors.map((c) => parseFloat(c.amount) || 0);
        const statusValues = initialContributors.map((c) => c.status);
        
        console.log('Will set form values:', {
          splitEnabled: true,
          contributor: contributorValues,
          contribution: contributionValues,
          contribution_status: statusValues
        });
        
        // Update the ref first
        console.log('Updating contributorsRef with:', initialContributors);
        contributorsRef.current = initialContributors;
        
        // Then update the form values
        console.log('Setting form values...');
        form.setValue("splitEnabled", true);
        form.setValue("contributor", contributorValues);
        form.setValue("contribution", contributionValues);
        form.setValue("contribution_status", statusValues);
        
        // Verify the values were set correctly
        console.log('Form values after setting:', {
          contributor: form.getValues('contributor'),
          contribution: form.getValues('contribution'),
          contribution_status: form.getValues('contribution_status')
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
          contribution_status: form.getValues('contribution_status'),
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

  useEffect(() => {
    if (!watchSplitEnabled) {
      contributorsRef.current = [];
      form.setValue("contributor", []);
      form.setValue("contribution", []);
      form.setValue("contribution_status", []);
      forceUpdate({});
    } else if (contributorsRef.current.length === 0) {
      addContributor();
    }
  }, [watchSplitEnabled]);

  // Memoize the team members and log any changes
  const availableTeamMembers = useMemo(() => {
    console.log('Available team members updated:', teamMembers);
    // Ensure we always return an array
    const members = Array.isArray(teamMembers) ? teamMembers : [];
    console.log('Team members count:', members.length);
    return members;
  }, [teamMembers]);

  // Effect to handle team members updates
  useEffect(() => {
    if (availableTeamMembers.length > 0 && expense?.contributor?.length) {
      console.log('Team members loaded, updating form with contributors...');
      
      // Process contributors with the now-available team members
      const initialContributors = expense.contributor.map((memberId, i) => {
        const teamMember = availableTeamMembers.find(m => m.name === memberId);
        return {
          id: `contributor-${i}-${Date.now()}`,
          teamMember: memberId,
          amount: expense.contribution?.[i]?.toString() || "0",
          status: expense.contribution_status?.[i] || "Pending",
        };
      });

      console.log('Setting contributorsRef with:', initialContributors);
      contributorsRef.current = initialContributors;
      
      // Update form values
      form.setValue("splitEnabled", true);
      form.setValue("contributor", initialContributors.map(c => c.teamMember));
      form.setValue("contribution", initialContributors.map(c => parseFloat(c.amount) || 0));
      form.setValue("contribution_status", initialContributors.map(c => c.status));
      
      // Force a re-render
      forceUpdate({});
    }
  }, [availableTeamMembers, expense]);

  // -------------------- Mutations --------------------
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ExpenseFormData, "splitEnabled">) => {
      console.log('Sending POST request to /api/expenses with data:', JSON.stringify(data, null, 2));
      try {
        const res = await apiRequest("POST", "/api/expenses", data);
        const responseData = await res.json();
        console.log('Received response from /api/expenses:', responseData);
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to create expense');
        }
        return responseData;
      } catch (error) {
        console.error('Error in create mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Expense created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
    mutationFn: async (data: Omit<ExpenseFormData, "splitEnabled">) => {
      if (!expense?.id) throw new Error("Expense ID is required");
      console.log(`Sending PATCH request to /api/expenses/${expense.id} with data:`, JSON.stringify(data, null, 2));
      try {
        const res = await apiRequest("PATCH", `/api/expenses/${expense.id}`, data);
        const responseData = await res.json();
        console.log('Received response from /api/expenses:', responseData);
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to update expense');
        }
        return responseData;
      } catch (error) {
        console.error('Error in update mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Expense updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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

  // -------------------- Corrected onSubmit --------------------
  const onSubmit = (data: ExpenseFormData) => {
    console.log('=== STARTING FORM SUBMISSION ===');
    console.log('Form data before processing:', JSON.stringify(data, null, 2));
    console.log('Contributors from ref:', JSON.stringify(contributorsRef.current, null, 2));
    
    // Destructure and transform field names to match server expectations
    const { splitEnabled, paidBy, ...expenseData } = data;
    
    // Create a new object with the correct types for the API
    const apiPayload: ExpenseApiPayload = {
      ...expenseData,
      paid_by: paidBy,  // Convert paidBy to paid_by
    };
    
    // Convert amount to string if it's a number
    if (typeof apiPayload.amount === 'number') {
      apiPayload.amount = apiPayload.amount.toString();
    }

    // Check if we have contributors regardless of splitEnabled
    const hasContributors = contributorsRef.current.length > 0;
    const shouldProcessContributors = splitEnabled || hasContributors;
    
    console.log('Processing contributors:', { 
      splitEnabled, 
      hasContributors, 
      shouldProcessContributors 
    });

    if (shouldProcessContributors && hasContributors) {
      console.log('Processing expense with contributors');
      apiPayload.contributor = contributorsRef.current.map((c) => c.teamMember);
      apiPayload.contribution = contributorsRef.current.map((c) => parseFloat(c.amount) || 0);
      apiPayload.contribution_status = contributorsRef.current.map((c) => c.status);
      
      console.log('Mapped contributor data:', {
        contributor: apiPayload.contributor,
        contribution: apiPayload.contribution,
        contribution_status: apiPayload.contribution_status
      });
    } else {
      console.log('No contributors, resetting contributor fields');
      apiPayload.contributor = [];
      apiPayload.contribution = [];
      apiPayload.contribution_status = [];
    }
    console.log('Final payload being sent to API:', JSON.stringify(apiPayload, null, 2));

    const mutationOptions = {
      onError: (error: any) => {
        console.error('Mutation error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          request: error.request
        });
      },
      onSuccess: (data: any) => {
        console.log('Mutation successful, response data:', data);
      }
    };

    if (isEditing) {
      console.log('Initiating update mutation...');
      // @ts-ignore - The mutation types expect paidBy but we're sending paid_by
      updateMutation.mutate(apiPayload, mutationOptions);
    } else {
      console.log('Initiating create mutation...');
      // @ts-ignore - The mutation types expect paidBy but we're sending paid_by
      createMutation.mutate(apiPayload, mutationOptions);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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

        {/* Row 2: From | Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From (previously PaidBy) */}
          <FormField
            control={form.control}
            name="paidBy"
            render={({ field }) => {
              const teamMembersWithFund = [
                ...(teamMembers || []),
                { id: 'ddc-fund', name: 'DDC Fund' }
              ];
              
              const isCustomValue = field.value && !teamMembersWithFund.some(member => member.name === field.value);
              
              // Use a separate effect to handle input focus
              useEffect(() => {
                if (showCustomInput && inputRef.current) {
                  inputRef.current.focus();
                }
              }, [showCustomInput, field.value]); // Add field.value to dependencies
              
              return (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  {!showCustomInput && !isCustomValue ? (
                    <div className="flex gap-2">
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            setShowCustomInput(true);
                            field.onChange('');
                          } else {
                            field.onChange(value);
                          }
                        }}
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Split Section */}
        <div className="pt-2">
          <Accordion
            type="single"
            collapsible
            value={isAccordionOpen ? "split-expense" : undefined}
            onValueChange={(v) => setIsAccordionOpen(v === "split-expense")}
          >
          <AccordionItem value="split-expense">
            <AccordionTrigger>To</AccordionTrigger>
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContributor}
                disabled={availableTeamMembers.length === 0 || !isAccordionOpen}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Contributor
              </Button>
            </AccordionContent>
          </AccordionItem>
          </Accordion>
        </div>

        {/* Row 4: Amount | Payment Mode */}
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

          {/* Payment Mode */}
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {config?.paymentModes?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {config?.paymentStatuses?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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