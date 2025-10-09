import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseRow } from "@/components/expense-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/forms/expense-form";

export default function Expenses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

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

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    const income = expenses
      .filter((e) => e.type === "Credit")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const expense = expenses
      .filter((e) => e.type === "Debit")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
      totalIncome: income.toLocaleString('en-IN'),
      totalExpense: expense.toLocaleString('en-IN'),
      netProfit: (income - expense).toLocaleString('en-IN'),
    };
  }, [expenses]);

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-transaction">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="total-income">
              ₹{totalIncome}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4" data-testid="total-expense">
              ₹{totalExpense}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="net-profit">
              ₹{netProfit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-expenses"
        />
      </div>

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
          <ExpenseForm expense={editingExpense} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
