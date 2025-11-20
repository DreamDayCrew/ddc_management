import { useState, useMemo } from "react";
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

export default function Expenses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const { data: expensesData = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    select: (data) => {
      // Create a new array to avoid mutating the original data
      const sortedData = [...data];
      // Sort by created_at in descending order (newest first)
      return sortedData.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    },
  });
  
  // Use the sorted data
  const expenses = expensesData;

  interface AppConfig {
    expenseCategories: string[];
    paymentStatuses: string[];
  }

  const { data: config } = useQuery<AppConfig>({
    queryKey: ["/api/configuration"],
  });

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<{[key: string]: string}>({});

  const handleStatusChange = (expenseId: string, status: string) => {
    setCardStatus(prev => ({
      ...prev,
      [expenseId]: status
    }));
    
    // Here you would typically make an API call to update the status
    // updateExpenseStatus(expenseId, status);
  };

  const categories = useMemo(() => {
    return config?.expenseCategories || [];
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

  const { totalIncome, totalExpense, netProfit, ddcBalance, repayment } = useMemo((): { 
    totalIncome: number; 
    totalExpense: number; 
    netProfit: number; 
    ddcBalance: number;
    repayment: number;
  } => {
    let income = 0;
    let expense = 0;
    let ddcBalance = 0;
    let ddcToOut = 0;
    let outToDdc = 0;

    expenses?.forEach((t) => {
      const amount = Number(t.amount) || 0;
      const splitType = t.split_type;
      const contributors = Array.isArray(t.contributor) ? t.contributor : [];

      const isDdcInvolvedInFromAccount = t.from_account === "DDC Fund";
      const isDdcInvolvedInToAccount = t.to_account === "DDC Fund";
      const isDdcInvolvedInContribution = contributors.includes("DDC Fund");

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
        if (isDdcInvolvedInToAccount) ddcBalance += amount;
        if (splitType === "to" && isDdcInvolvedInContribution) {
          income += ddcContribution;
          ddcBalance += ddcContribution;
        }
      }

      // ---------- DEBIT ----------
      if (t.type === "Debit") {
        expense += amount;
        if (isDdcInvolvedInFromAccount) ddcBalance -= amount;
        if (splitType === "from" && isDdcInvolvedInContribution) {
          expense += ddcContribution;
          ddcBalance -= ddcContribution;
        }
      }

      // ---------- TRANSFER ----------
      if (t.type === "Transfer") {
        const fromAcc = t.from_account || "";
        const toAcc = t.to_account || "";

        // DDC → Someone else
        if (isDdcInvolvedInFromAccount && toAcc !== "Kumudha Glory") {
          ddcBalance -= amount;
          ddcToOut += amount;
        }

        // Someone else → DDC
        if (isDdcInvolvedInToAccount && fromAcc !== "Kumudha Glory") {
          ddcBalance += amount;
          outToDdc += amount;
        }

        // handle split contributions
        if (splitType === "to" && isDdcInvolvedInContribution && toAcc !== "Kumudha Glory") {
          ddcBalance += ddcContribution;
          ddcToOut += ddcContribution;
        }

        if (splitType === "from" && isDdcInvolvedInContribution && fromAcc !== "Kumudha Glory") {
          ddcBalance -= ddcContribution;
          outToDdc += ddcContribution;
        }
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      ddcBalance,
      repayment: ddcToOut - outToDdc, // positive => others owe DDC
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const description = expense.description || '';
      const matchesSearch = description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingExpense(undefined);
    }
  };

  const handleFormSuccess = () => {
    handleDialogClose(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Expenses & Income
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all financial transactions
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          data-testid="button-add-transaction"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Income Card */}
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'income' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('income')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
              {expandedCard === 'income' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="income-status"
                          checked={cardStatus['income'] === status}
                          onChange={() => handleStatusChange('income', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Total Expense Card */}
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'expense' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('expense')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                ₹{totalExpense.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All debit transactions</p>
              {expandedCard === 'expense' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="expense-status"
                          checked={cardStatus['expense'] === status}
                          onChange={() => handleStatusChange('expense', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Expenses & Income
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all financial transactions
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          data-testid="button-add-transaction"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Income Card */}
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'income' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('income')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
              {expandedCard === 'income' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="income-status"
                          checked={cardStatus['income'] === status}
                          onChange={() => handleStatusChange('income', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Total Expense Card */}
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'expense' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('expense')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                ₹{totalExpense.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All debit transactions</p>
              {expandedCard === 'expense' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="expense-status"
                          checked={cardStatus['expense'] === status}
                          onChange={() => handleStatusChange('expense', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'income' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('income')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
              {expandedCard === 'income' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="income-status"
                          checked={cardStatus['income'] === status}
                          onChange={() => handleStatusChange('income', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Total Expense Card */}
        <div className="relative">
          <Card 
            className={`transition-all duration-200 ${expandedCard === 'expense' ? 'shadow-lg border-primary/50' : 'hover:shadow-md hover:border-primary/20'}`}
            onMouseEnter={() => setExpandedCard('expense')}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                ₹{totalExpense.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All debit transactions</p>
              {expandedCard === 'expense' && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Update Status:</p>
                  <div className="space-y-2">
                    {config?.paymentStatuses?.map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="expense-status"
                          checked={cardStatus['expense'] === status}
                          onChange={() => handleStatusChange('expense', status)}
                          className="h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="net-profit">
              ₹{ddcBalance}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current Balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="ddc-balance">
              ₹{netProfit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All credit and debit transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending repayments</CardTitle>
            <RotateCcw className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1" data-testid="transactions-count">
              ₹{repayment}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total repayment</p>
          </CardContent>
        </Card>
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

      {isLoading ? (
        <div className="text-muted-foreground">Loading transactions...</div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-transactions">All</TabsTrigger>
            <TabsTrigger value="credit" data-testid="tab-credit">Credit</TabsTrigger>
            <TabsTrigger value="debit" data-testid="tab-debit">Debit</TabsTrigger>
            <TabsTrigger value="transfer" data-testid="tab-transfer">Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No transactions found
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    {...expense}
                    type={expense.type as "Credit" | "Debit" | "Transfer"}
                    amount={expense.amount}
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="credit" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses
                .filter((e) => e.type === "Credit")
                .map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    {...expense}
                    type={expense.type as "Credit" | "Debit" | "Transfer"}
                    amount={expense.amount}
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="debit" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses
                .filter((e) => e.type === "Debit")
                .map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    {...expense}
                    type={expense.type as "Credit" | "Debit" | "Transfer"}
                    amount={expense.amount}
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <div className="space-y-3">
              {filteredExpenses
                .filter((e) => e.type === "Transfer")
                .map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    {...expense}
                    type={expense.type as "Credit" | "Debit" | "Transfer"}
                    amount={expense.amount}
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            expense={editingExpense ? {
              ...editingExpense,
              toAccount: editingExpense.to_account,
              fromAccount: editingExpense.from_account,
              splitEnabled: false, // or true based on your business logic
              contributor: editingExpense.contributor || [],
              contribution: editingExpense.contribution 
                ? editingExpense.contribution.map(Number) 
                : [],
              contributionStatus: editingExpense.contribution_status || []
            } : undefined} 
            onSuccess={handleFormSuccess} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
