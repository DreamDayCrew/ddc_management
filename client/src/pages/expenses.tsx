import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseRow } from "@/components/expense-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");

  const expensesData = [
    {
      id: "1",
      type: "Credit" as const,
      description: "Payment received from Sharma Wedding",
      amount: "1,50,000",
      mode: "Cash",
      date: "2025-10-05",
      status: "Completed",
    },
    {
      id: "2",
      type: "Debit" as const,
      description: "Payment to Royal Decorators",
      amount: "35,000",
      mode: "Gray",
      date: "2025-10-03",
      status: "Completed",
    },
    {
      id: "3",
      type: "Transfer" as const,
      description: "Internal fund transfer to operations",
      amount: "50,000",
      mode: "Bank Transfer",
      date: "2025-10-01",
      status: "Pending",
    },
    {
      id: "4",
      type: "Credit" as const,
      description: "Advance payment - Corporate Event",
      amount: "80,000",
      mode: "Cash",
      date: "2025-09-28",
      status: "Completed",
    },
    {
      id: "5",
      type: "Debit" as const,
      description: "Venue booking payment",
      amount: "45,000",
      mode: "Cash",
      date: "2025-09-25",
      status: "Completed",
    },
  ];

  const totalIncome = "2,45,000";
  const totalExpense = "1,70,000";
  const netProfit = "75,000";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Expenses & Income</h1>
          <p className="text-muted-foreground mt-1">
            Track all financial transactions
          </p>
        </div>
        <Button data-testid="button-add-transaction">
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
            <div className="text-2xl font-bold text-chart-2" data-testid="total-income">₹{totalIncome}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4" data-testid="total-expense">₹{totalExpense}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="net-profit">₹{netProfit}</div>
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-transactions">All</TabsTrigger>
          <TabsTrigger value="credit" data-testid="tab-credit">Credit</TabsTrigger>
          <TabsTrigger value="debit" data-testid="tab-debit">Debit</TabsTrigger>
          <TabsTrigger value="transfer" data-testid="tab-transfer">Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {expensesData.map((expense) => (
              <ExpenseRow key={expense.id} {...expense} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credit" className="mt-6">
          <div className="space-y-3">
            {expensesData
              .filter((e) => e.type === "Credit")
              .map((expense) => (
                <ExpenseRow key={expense.id} {...expense} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="debit" className="mt-6">
          <div className="space-y-3">
            {expensesData
              .filter((e) => e.type === "Debit")
              .map((expense) => (
                <ExpenseRow key={expense.id} {...expense} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="transfer" className="mt-6">
          <div className="space-y-3">
            {expensesData
              .filter((e) => e.type === "Transfer")
              .map((expense) => (
                <ExpenseRow key={expense.id} {...expense} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
