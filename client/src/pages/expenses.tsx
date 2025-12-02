import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Plus, Loader2, List, Search, ReceiptIndianRupee, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseRow } from "@/components/expense-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function Expenses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [selectedMembers, setSelectedMembers] = useState<Record<string, { checked: boolean; amount: number }>>({});
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  type CardId = 'income' | 'expense' | 'balance' | 'profit' | 'repayment';
  const [expandedCard, setExpandedCard] = useState<CardId | null>(null);
  const [cardStatus, setCardStatus] = useState<Record<CardId, string>>({
    income: '',
    expense: '',
    balance: '',
    profit: '',
    repayment: ''
  });
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, number>>({});

  // Initialize repaymentAmounts from selectedMembers
  useEffect(() => {
    const initialAmounts: Record<string, number> = {};
    Object.entries(selectedMembers).forEach(([key, value]) => {
      if (value.checked && value.amount) {
        initialAmounts[key] = value.amount;
      }
    });
    setRepaymentAmounts(initialAmounts);
  }, [selectedMembers]);

  // Fetch expenses data
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    select: (data: Expense[]) => {
      console.log('API Response - Expenses loaded:', data.length, 'expenses');
      if (data.length > 0) {
        console.log('Sample expense:', data[0]);
      }
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        return [];
      }
      // Create a new array to avoid mutating the original data and sort by created_at in descending order
      return [...data].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    },
  });
  // Type definitions
  interface StatusAmounts {
    [key: string]: number;
  }
  
  interface CardData {
    total: number;
    byStatus: StatusAmounts;
  }
  
  interface ByStatusType {
    income: CardData;
    expense: CardData;
    balance: CardData;
    repayment: CardData;
  }
  
  interface CardAmounts {
    total: number;
    byStatus: StatusAmounts;
  }

  interface AppConfig {
    expenseCategories: string[];
    paymentStatuses: string[];
  }
  
  const { data: config } = useQuery<AppConfig>({
    queryKey: ["/api/configuration"],
  });

  const categories = useMemo(() => {
    return config?.expenseCategories || [];
  }, [config]);
  
  // Get payment statuses from config or use default values
  const paymentStatuses = useMemo(() => {
    return config?.paymentStatuses || ['To Do', 'Completed'];
  }, [config]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  interface CardData {
    total: number;
    byStatus: StatusAmounts;
  }

  interface ByStatusType {
    income: CardData;
    expense: CardData;
    balance: CardData;
    repayment: CardData;
  }

  interface CardAmounts {
    total: number;
    byStatus: StatusAmounts;
  }

  const calculateTotals = (expenses: Expense[], cardStatus: Record<CardId, string>): {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    ddcBalance: number;
    repayment: number;
    byStatus: ByStatusType;
    repaymentList: { source: string; amount: number }[];
  } => {
    // Initialize status trackers for each card type
    const incomeByStatus: StatusAmounts = {};
    const expenseByStatus: StatusAmounts = {};
    const balanceByStatus: StatusAmounts = {};
    
    let income = 0;
    let expense = 0;
    let ddcBalance = 0;
    let ddcToOut = 0;
    let outToDdc = 0;
    let repayments: Record<string, number> = {};
    
    expenses.forEach((t) => {
      const fromAcc = t.from_account || "";
      const toAcc = t.to_account || "";
      const status = t.status || 'No Status';
      const amount = Number(t.amount) || 0;
      
      // Initialize status amounts if they don't exist
      if (!incomeByStatus[status]) incomeByStatus[status] = 0;
      if (!expenseByStatus[status]) expenseByStatus[status] = 0;
      if (!balanceByStatus[status]) balanceByStatus[status] = 0;
      
      // Skip if this expense's status is filtered out
      const typeToCard: Record<string, CardId> = {
        Credit: "income",
        Debit: "expense",
        Transfer: "balance"
      };
      const cardId = typeToCard[t.type];
      if (cardId && cardStatus[cardId]) {
        const allowedStatuses = cardStatus[cardId].split(",").filter(Boolean);
        if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
          return; // skip this transaction
        }
      }

      const splitType = t.split_type;
      const contributors = Array.isArray(t.contributor) ? t.contributor : [];

      const isDdcInvolvedInFromAccount = t.from_account === "DDC Fund";
      const isDdcInvolvedInToAccount = t.to_account === "DDC Fund";
      const isDdcInvolvedInContribution = contributors.some(c => c === "DDC Fund");

      let ddcContribution = 0;
      if (isDdcInvolvedInContribution && Array.isArray(t.contribution)) {
        const idx = contributors.findIndex((c) => c === "DDC Fund");
        if (idx !== -1) {
          ddcContribution = Number(t.contribution[idx]) || 0;
        }
      }

      // ---------- CREDIT ----------
      if (t.type === "Credit") {
        income += amount;
        incomeByStatus[status] = (incomeByStatus[status] || 0) + amount;
        if (isDdcInvolvedInToAccount) {
          ddcBalance += amount;
          balanceByStatus[status] = (balanceByStatus[status] || 0) + amount;
        }
        if (splitType === "to" && isDdcInvolvedInContribution) {
          const contrib = ddcContribution;
          income += contrib;
          ddcBalance += contrib;
          incomeByStatus[status] = (incomeByStatus[status] || 0) + contrib;
          balanceByStatus[status] = (balanceByStatus[status] || 0) + contrib;
        }
      }

      // ---------- DEBIT ----------
      if (t.type === "Debit") {
        expense += amount;
        expenseByStatus[status] = (expenseByStatus[status] || 0) + amount;
        if (isDdcInvolvedInFromAccount) {
          ddcBalance -= amount;
          balanceByStatus[status] = (balanceByStatus[status] || 0) - amount;
        }
        if (splitType === "from" && isDdcInvolvedInContribution) {
          const contrib = ddcContribution;
          expense += contrib;
          ddcBalance -= contrib;
          expenseByStatus[status] = (expenseByStatus[status] || 0) + contrib;
          balanceByStatus[status] = (balanceByStatus[status] || 0) - contrib;
        }
      }

      // ---------- TRANSFER ----------
      if (t.type === "Transfer") {
        if (isDdcInvolvedInFromAccount) {
          ddcBalance -= amount;
          ddcToOut += amount;
          balanceByStatus[status] = (balanceByStatus[status] || 0) - amount;
          repayments[toAcc] = (repayments[toAcc] || 0) - amount;
        }
        if (isDdcInvolvedInToAccount) {
          ddcBalance += amount;
          outToDdc += amount;
          balanceByStatus[status] = (balanceByStatus[status] || 0) + amount;
          repayments[fromAcc] = (repayments[fromAcc] || 0) + amount;
        }
        if (splitType === "to" && isDdcInvolvedInContribution) {
          const contrib = ddcContribution;
          ddcBalance += contrib;
          ddcToOut += contrib;
          balanceByStatus[status] = (balanceByStatus[status] || 0) + contrib;
          repayments[toAcc] = (repayments[toAcc] || 0) - ddcContribution;
        }
        if (splitType === "from" && isDdcInvolvedInContribution) {
          const contrib = ddcContribution;
          ddcBalance -= contrib;
          outToDdc += contrib;
          balanceByStatus[status] = (balanceByStatus[status] || 0) - contrib;
          repayments[fromAcc] = (repayments[fromAcc] || 0) + ddcContribution;
        }
      }
    });

    // Calculate repayment by status (simplified - you might want to adjust this based on your needs)
    const repaymentByStatus: StatusAmounts = {};
    Object.keys(balanceByStatus).forEach(status => {
      repaymentByStatus[status] = balanceByStatus[status] > 0 ? balanceByStatus[status] : 0;
    });
    
    const repaymentList = Object.entries(repayments)
    .map(([source, amount]) => ({
      source,
      amount: Math.abs(amount),
    }))
    .filter((r) => r.amount > 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      ddcBalance,
      repayment: ddcToOut - outToDdc,
      byStatus: {
        income: { total: income, byStatus: incomeByStatus },
        expense: { total: expense, byStatus: expenseByStatus },
        balance: { total: ddcBalance, byStatus: balanceByStatus },
        repayment: { total: ddcToOut - outToDdc, byStatus: repaymentByStatus }
      },
      repaymentList,
    };
  }


  // Calculate totals using the memoized function
  const { totalIncome, totalExpense, netProfit, ddcBalance, repayment, byStatus, repaymentList } = useMemo(() => {
    const totals = calculateTotals(expenses, cardStatus);
    
    // Calculate the filtered repayment amount based on selected members
    if (Object.keys(selectedMembers).length > 0) {
      let filteredRepayment = 0;
      
      // Sum up amounts for selected members
      Object.entries(selectedMembers).forEach(([member, { checked, amount }]) => {
        if (checked) {
          filteredRepayment += amount;
        }
      });
      
      // Update the repayment amount in the totals
      return {
        ...totals,
        repayment: filteredRepayment,
        byStatus: {
          ...totals.byStatus,
          repayment: {
            ...totals.byStatus.repayment,
            total: filteredRepayment
          }
        }
      };
    }
    
    return totals;
  }, [expenses, cardStatus, selectedMembers]);

  // Calculate running balance for each transaction
  const expensesWithRunningBalance = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    // Sort by date descending (newest first) for display
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    
    let runningBalance = ddcBalance;
    
    // Calculate running balance for each transaction from current balance backwards
    const withBalance = sortedExpenses.map((expense) => {
      const currentBalance = runningBalance;
      const amount = Number(expense.amount) || 0;
      
      // Update running balance for next iteration (going backwards in time)
      if (expense.type === 'Credit') {
        runningBalance -= amount;
      } else if (expense.type === 'Debit') {
        runningBalance += amount;
      }
      
      return {
        ...expense,
        closing_balance: currentBalance.toString()
      };
    });
    
    return withBalance;
  }, [expenses, ddcBalance]);

  // Get distinct 'from' values for Transfer transactions
  const transferFromValues = useMemo((): string[] => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      console.log('No expenses to calculate transfer from values');
      return [];
    }
    
    // Extract unique 'from' values from Transfer transactions
    const fromValues = new Set<string>();
    
    expenses.forEach((expense: Expense) => {
      if (expense.type === 'Transfer' && expense.from_account) {
        fromValues.add(expense.from_account);
      }
      // Also include to_account for transfers to show all possible sources
      if (expense.type === 'Transfer' && expense.to_account) {
        fromValues.add(expense.to_account);
      }
    });
    
    return Array.from(fromValues).sort();
  }, [expenses]);

  // Helper function to check if an expense matches the selected status for a card
  const matchesCardStatus = (expense: Expense | null | undefined, cardId: CardId): boolean => {
    if (!expense) return false;
    try {
      // If no card status is set, include all expenses
      if (!cardStatus[cardId] || !expense) return true;
      
      // Get selected statuses for the card
      const selectedStatuses = cardStatus[cardId].split(',').filter(Boolean);
      
      // If no statuses are selected, include all expenses
      if (selectedStatuses.length === 0) return true;
      
      // If expense has no status, only include if 'No Status' is selected
      const expenseStatus = expense.status?.trim() || 'No Status';
      
      return selectedStatuses.some(status => status.trim() === expenseStatus);
    } catch (error) {
      console.error('Error in matchesCardStatus:', error, { expense, cardId });
      return false; // Be conservative - don't show potentially incorrect data
    }
  };

  // Initialize card statuses with all payment statuses selected by default
  useEffect(() => {
    if (paymentStatuses?.length > 0) {
      const allStatuses = paymentStatuses.join(',');
      
      setCardStatus(prev => {
        // Only update if any of the statuses are empty or if paymentStatuses has changed
        const currentStatuses = Object.values(prev).join(',');
        if (currentStatuses !== allStatuses) {
          const newStatus = {
            income: allStatuses,
            expense: allStatuses,
            balance: allStatuses,
            profit: allStatuses,
            repayment: allStatuses
          };
          console.log('Initialized cardStatus with all statuses');
          return newStatus;
        }
        return prev;
      });
    }
  }, [paymentStatuses]);

  const filteredExpenses = useMemo((): Expense[] => {
    // Validate expenses data
    if (!expensesWithRunningBalance || !Array.isArray(expensesWithRunningBalance) || expensesWithRunningBalance.length === 0) {
      console.log('No expenses to filter');
      return [];
    }
    
    // Early return if no search query or category filter is active
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasCategoryFilter = Boolean(selectedCategory);
    
    console.log('Filtering', expensesWithRunningBalance.length, 'expenses...');
    console.log('Current cardStatus:', cardStatus);
    
    // Filter expenses based on search and category first (cheaper operations)
    const filtered = expensesWithRunningBalance.filter(expense => {
      // Check search query if present
      if (hasSearchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const description = (expense.description || '').toLowerCase();
        const category = (expense.category || '').toLowerCase();
        
        if (!description.includes(searchLower) && !category.includes(searchLower)) {
          return false;
        }
      }
      
      // Check category filter if present
      if (hasCategoryFilter && expense.category !== selectedCategory) {
        return false;
      }
      
      return true;
    });
    
    // Then apply card status filters
    const result = filtered.filter(expense => {
      const isIncome = expense.type === 'Credit';
      const isExpense = expense.type === 'Debit';
      const isTransfer = expense.type === 'Transfer';
      
      // For each expense type, check if it matches the corresponding card status
      if (isIncome) {
        return matchesCardStatus(expense, 'income');
      } else if (isExpense) {
        return matchesCardStatus(expense, 'expense');
      } else if (isTransfer) {
        const isDdcInvolved = expense.from_account === 'DDC Fund' || expense.to_account === 'DDC Fund';
        return !isDdcInvolved || matchesCardStatus(expense, 'balance');
      }
      
      // If it's not a recognized type, include it (or exclude it based on your requirements)
      return true;
    });
    
    console.log('Filtered expenses:', result.length, 'out of', expenses.length);
    return result;
  }, [expensesWithRunningBalance, searchQuery, selectedCategory, cardStatus]);

  const clearFilters = (): void => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  const handleEdit = (expense: Expense): void => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDelete = (id: string): void => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean): void => {
    setDialogOpen(open);
    if (!open) {
      setEditingExpense(undefined);
    }
  };

  const handleFormSuccess = (): void => {
    handleDialogClose(false);
  };

  const handleStatusChange = (cardId: CardId, value: string, amount: number = 0): void => {
    // Handle repayment card status changes
    if (cardId === 'repayment') {
      setSelectedMembers(prev => {
        const currentState = prev[value] || { checked: true, amount };
        const newChecked = !currentState.checked;
        const newState = {
          ...prev,
          [value]: {
            ...currentState,
            checked: newChecked,
            amount: amount || currentState.amount
          }
        };
        
        // Ensure at least one item remains checked
        const allUnchecked = Object.values(newState).every(member => !member.checked);
        if (allUnchecked) {
          newState[value].checked = true; // Keep at least one checked
        }
        
        // Update repayment amounts
        setRepaymentAmounts(prev => {
          const newAmounts = { ...prev };
          if (newState[value].checked) {
            newAmounts[value] = amount || currentState.amount;
          } else {
            delete newAmounts[value];
          }
          return newAmounts;
        });
        
        return newState;
      });
      
      // Update the card status with the new selection
      setCardStatus(prev => ({
        ...prev,
        [cardId]: prev[cardId].includes(value)
          ? prev[cardId].split(',').filter(s => s !== value).join(',')
          : [...prev[cardId].split(','), value].filter(Boolean).join(',')
      }));
      console.log(cardStatus, '-- ',value);
      return;
    }
    
    // Handle profit card status changes
    if (cardId === 'profit') {
      setCardStatus(prev => {
        const currentStatuses = prev[cardId].split(',').filter(Boolean);
        const newStatuses = currentStatuses.includes(value)
          ? currentStatuses.filter(s => s !== value)
          : [...currentStatuses, value];
        
        return { ...prev, [cardId]: newStatuses.join(',') };
      });
      return;
    }
    setCardStatus(prev => {
      const currentStatuses = prev[cardId].split(',').filter(Boolean);
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
      
      const updated = { ...prev, [cardId]: newStatuses.join(',') };
      console.log(`Updated ${cardId} filters:`, updated[cardId]);

      // Optional: Preview updated totals
      const previewTotals = calculateTotals(expenses, updated);
      console.log('Recalculated totals →', previewTotals);

      return updated;
    });
    // Here you can add any additional logic that should run when status changes
    // For example, you might want to update calculations based on the selected status
  };

  const handleCardHover = (cardId: CardId): void => {
    setExpandedCard(cardId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading expenses: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ... (rest of the code remains the same) */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Expenses & Income
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all financial transactions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-transaction">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Income Card */}
        <div 
          className="relative"
          onMouseEnter={() => handleCardHover('income')}
          onMouseLeave={() => setExpandedCard(null)}
        >
          <Card className={`transition-all duration-200 ${expandedCard === 'income' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2" data-testid="total-income">
                ₹{totalIncome}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All credit transactions</p>
              
              {/* Status Breakdown (shown on hover) */}
              {expandedCard === 'income' && byStatus?.income && (
                <div className="mt-3 pt-3 border-t">
                  <div className="space-y-2">
                    {Object.entries(byStatus.income.byStatus).map(([status, amount]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!cardStatus['income'] || cardStatus['income'].split(',').includes(status)}
                            onChange={() => handleStatusChange('income', status)}
                            className="h-4 w-4 text-primary border-gray-300 rounded"
                          />
                          <span className="text-sm capitalize">{status.toLowerCase()}</span>
                        </div>
                        <span className="text-sm font-medium">₹{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Total Expense Card */}
        <div 
          className="relative"
          onMouseEnter={() => handleCardHover('expense')}
          onMouseLeave={() => setExpandedCard(null)}
        >
          <Card className={`transition-all duration-200 ${expandedCard === 'expense' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4" data-testid="total-expense">
                ₹{totalExpense}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All debit transactions</p>
              
              {/* Status Breakdown (shown on hover) */}
              {expandedCard === 'expense' && byStatus?.expense && (
                <div className="mt-3 pt-3 border-t">
                  <div className="space-y-2">
                    {Object.entries(byStatus.expense.byStatus).map(([status, amount]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!cardStatus['expense'] || cardStatus['expense'].split(',').includes(status)}
                            onChange={() => handleStatusChange('expense', status)}
                            className="h-4 w-4 text-primary border-gray-300 rounded"
                          />
                          <span className="text-sm capitalize">{status.toLowerCase()}</span>
                        </div>
                        <span className="text-sm font-medium">₹{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Balance Card */}
        <div 
          className="relative"
          onMouseEnter={() => handleCardHover('balance')}
          onMouseLeave={() => setExpandedCard(null)}
        >
          <Card className={`transition-all duration-200 ${expandedCard === 'balance' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <ReceiptIndianRupee className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="net-profit">
                ₹{ddcBalance}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current Balance</p>
              {expandedCard === 'balance' && byStatus?.balance && (
                <div className="mt-3 pt-3 border-t">
                  <div className="space-y-2">
                    {Object.entries(byStatus.balance.byStatus as Record<string, number>).map(([status, amount]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!cardStatus['balance'] || cardStatus['balance'].split(',').includes(status)}
                            onChange={() => handleStatusChange('balance', status)}
                            className="h-4 w-4 text-primary border-gray-300 rounded"
                          />
                          <span className="text-sm capitalize">{status.toLowerCase()}</span>
                        </div>
                        <span className="text-sm font-medium">₹{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Net Profit Card */}
        <div 
          className="relative"
          onMouseEnter={() => handleCardHover('profit')}
          onMouseLeave={() => setExpandedCard(null)}
        >
          <Card className={`transition-all duration-200 ${expandedCard === 'profit' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="ddc-balance">
                ₹{netProfit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All credit and debit transactions</p>
              {expandedCard === 'profit' && byStatus?.income?.byStatus && byStatus?.expense?.byStatus && (
                <div className="mt-3 pt-3 border-t">
                  <div className="space-y-2">
                    {Array.from(
                      new Set([
                        ...Object.keys(byStatus.income.byStatus || {}),
                        ...Object.keys(byStatus.expense.byStatus || {})
                      ])
                    )
                    .filter(status => status) // Filter out any empty statuses
                    .map((status) => {
                      const income = status ? (byStatus.income.byStatus[status] || 0) : 0;
                      const expense = status ? (byStatus.expense.byStatus[status] || 0) : 0;
                      const profit = income - expense;
                      const isChecked = !cardStatus['profit'] || cardStatus['profit'].split(',').includes(status);
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleStatusChange('profit', status)}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className={`text-sm font-medium ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {status ? status.toLowerCase() : 'No Status'}
                            </span>
                          </div>
                          <span 
                            className={`text-sm font-medium ${
                              profit > 0 ? 'text-green-500' : profit < 0 ? 'text-red-500' : 'text-foreground'
                            }`}
                          >
                            {profit > 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Repayments Card */}
        <div 
          className="relative"
          onMouseEnter={() => handleCardHover('repayment')}
          onMouseLeave={() => setExpandedCard(null)}
        >
          <Card className={`h-full transition-all duration-200 ${expandedCard === 'repayment' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Repayments</CardTitle>
              <RotateCcw className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent className="pb-4">
              <div>
                <div className="text-2xl font-bold text-chart-1" data-testid="pending-repayment-amount">
                  ₹{repayment}
                </div>
                <p className="text-xs text-muted-foreground">DDC repayment amount</p>
                {expandedCard === 'repayment' && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="space-y-2">
                        {repaymentList.length > 0 && (
                          <ul className="mt-3 space-y-1 text-sm">
                            {repaymentList.map((r) => (
                              <li key={r.source} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedMembers[r.source]?.checked}
                                    onChange={() => handleStatusChange('repayment', r.source, r.amount)}
                                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                  />
                                  <span>{r.source}</span>
                                </div>
                                <span className="font-medium">₹{r.amount}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                )}                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-expenses"
          />
        </div>

        <div className="w-full sm:w-64">
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button 
                onClick={() => setSearchQuery("")} 
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <button 
                onClick={() => setSelectedCategory("")} 
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                aria-label="Clear category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-6">
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="credit">Income</TabsTrigger>
              <TabsTrigger value="debit">Expenses</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Showing {filteredExpenses.length} transactions
            </div>
          </div>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found. Try adjusting your filters.
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    {...expense}
                    type={expense.type as "Credit" | "Debit" | "Transfer"}
                    amount={expense.amount}
                    closing_balance={expense.closing_balance}
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="credit" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.filter((expense) => expense.type === "Credit").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No income transactions found.
                </div>
              ) : (
                filteredExpenses
                  .filter((expense) => expense.type === "Credit")
                  .map((expense) => (
                    <ExpenseRow
                      key={expense.id} 
                      {...expense}
                      type={expense.type as "Credit" | "Debit" | "Transfer"}
                      amount={expense.amount}
                      closing_balance={expense.closing_balance}
                      onEdit={() => handleEdit(expense)}
                      onDelete={() => handleDelete(expense.id)}
                    />
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="debit" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.filter((expense) => expense.type === "Debit").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expense transactions found.
                </div>
              ) : (
                filteredExpenses
                  .filter((expense) => expense.type === "Debit")
                  .map((expense) => (
                    <ExpenseRow
                      key={expense.id} 
                      {...expense}
                      type={expense.type as "Credit" | "Debit" | "Transfer"}
                      amount={expense.amount}
                      closing_balance={expense.closing_balance}
                      onEdit={() => handleEdit(expense)}
                      onDelete={() => handleDelete(expense.id)}
                    />
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.filter((expense) => expense.type === "Transfer").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transfer transactions found.
                </div>
              ) : (
                filteredExpenses
                  .filter((expense) => expense.type === "Transfer")
                  .map((expense) => {
                    // Ensure all required fields have default values
                    const safeExpense = {
                      id: expense.id || '',
                      type: (expense.type as "Credit" | "Debit" | "Transfer") || 'Debit',
                      description: expense.description || '',
                      amount: expense.amount || '0',
                      category: expense.category || null,
                      mode: null, // Add mode with default null since it's optional in ExpenseRow
                      date: expense.date || new Date().toISOString(),
                      status: expense.status || 'Pending',
                      closing_balance: expense.closing_balance || '0',
                    };
                    
                    return (
                      <ExpenseRow
                        key={expense.id}
                        {...safeExpense}
                        onEdit={() => handleEdit(expense)}
                        onDelete={() => handleDelete(expense.id)}
                      />
                    );
                  })
              )}
            </div>
          </TabsContent>
        </Tabs>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            expense={
              editingExpense
                ? {
                    id: editingExpense.id,
                    date: editingExpense.date,
                    type: editingExpense.type,
                    fromAccount: editingExpense.from_account,
                    toAccount: editingExpense.to_account || null,
                    description: editingExpense.description || null,
                    amount: editingExpense.amount,
                    category: editingExpense.category || null,
                    contributor: editingExpense.contributor || [],
                    contribution: editingExpense.contribution 
                      ? editingExpense.contribution.map(Number) 
                      : [],
                    contributionStatus: editingExpense.contribution_status || [],
                    splitEnabled: false
                  }
                : undefined
            }
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
