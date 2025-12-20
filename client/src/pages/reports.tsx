import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import type { Event, Expense, Asset } from "@shared/schema";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CHART_COLORS = {
  completed: "hsl(var(--chart-1))",
  inProgress: "hsl(var(--chart-2))",
  missed: "hsl(var(--chart-3))",
  income: "hsl(var(--chart-1))",
  expense: "hsl(var(--chart-3))",
  asset: "hsl(var(--chart-4))",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Reports() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [leftMonth, setLeftMonth] = useState<number>(lastMonth);
  const [leftYear, setLeftYear] = useState<number>(lastMonthYear);
  const [rightMonth, setRightMonth] = useState<number>(currentMonth);
  const [rightYear, setRightYear] = useState<number>(currentYear);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const parseISODate = (dateString: string): { year: number; month: number } | null => {
    if (!dateString) return null;
    const parts = dateString.split('T')[0].split('-');
    if (parts.length < 2) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
    };
  };

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(currentYear);
    yearSet.add(currentYear - 1);
    events.forEach((e) => {
      const parsed = parseISODate(e.eventDate);
      if (parsed) yearSet.add(parsed.year);
    });
    expenses.forEach((e) => {
      const parsed = parseISODate(e.date);
      if (parsed) yearSet.add(parsed.year);
    });
    assets.forEach((a) => {
      if (a.purchaseDate) {
        const parsed = parseISODate(a.purchaseDate);
        if (parsed) yearSet.add(parsed.year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [events, expenses, assets, currentYear]);

  const filterByMonthYear = <T extends { date?: string; eventDate?: string; purchaseDate?: string | null }>(
    items: T[],
    month: number,
    year: number,
    dateField: keyof T
  ) => {
    return items.filter((item) => {
      const dateValue = item[dateField];
      if (!dateValue) return false;
      const parsed = parseISODate(dateValue as string);
      if (!parsed) return false;
      return parsed.month === month && parsed.year === year;
    });
  };

  const getEventStats = (month: number, year: number) => {
    const filtered = filterByMonthYear(events, month, year, "eventDate");
    const completed = filtered.filter((e) => e.eventStatus === "Completed").length;
    const inProgress = filtered.filter((e) => e.eventStatus === "In Progress").length;
    const missed = filtered.filter((e) => e.eventStatus === "Inquiry").length;
    return { completed, inProgress, missed, total: filtered.length };
  };

  const getFinancialStats = (month: number, year: number) => {
    const filteredExpenses = filterByMonthYear(expenses, month, year, "date");
    // Credit (Income): When to_account = "DDC Fund" (money coming IN)
    const income = filteredExpenses
      .filter((e) => e.to_account === "DDC Fund")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    // Debit (Expenses): When from_account = "DDC Fund" (money going OUT)
    const eventExpenses = filteredExpenses
      .filter((e) => e.from_account === "DDC Fund" && e.category === "Event")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const assetExpenses = filteredExpenses
      .filter((e) => e.from_account === "DDC Fund" && e.category === "Asset")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const officeExpenses = filteredExpenses
      .filter((e) => e.from_account === "DDC Fund" && e.category === "Office")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = eventExpenses + assetExpenses + officeExpenses;
    return { income, eventExpenses, assetExpenses, officeExpenses, totalExpenses };
  };

  const getAssetStats = (month: number, year: number) => {
    const filtered = filterByMonthYear(assets, month, year, "purchaseDate");
    const count = filtered.length;
    const totalInvestment = filtered.reduce((sum, a) => sum + Number(a.purchasedAmount || 0), 0);
    return { count, totalInvestment };
  };

  const eventStats = getEventStats(selectedMonth, selectedYear);
  const financialStats = getFinancialStats(selectedMonth, selectedYear);
  const assetStats = getAssetStats(selectedMonth, selectedYear);

  const leftEventStats = getEventStats(leftMonth, leftYear);
  const leftFinancialStats = getFinancialStats(leftMonth, leftYear);
  const leftAssetStats = getAssetStats(leftMonth, leftYear);

  const rightEventStats = getEventStats(rightMonth, rightYear);
  const rightFinancialStats = getFinancialStats(rightMonth, rightYear);
  const rightAssetStats = getAssetStats(rightMonth, rightYear);

  const eventChartData = [
    { name: "Completed", value: eventStats.completed, fill: CHART_COLORS.completed },
    { name: "In Progress", value: eventStats.inProgress, fill: CHART_COLORS.inProgress },
    { name: "Missed", value: eventStats.missed, fill: CHART_COLORS.missed },
  ];

  const financialChartData = [
    { name: "Income", amount: financialStats.income, fill: CHART_COLORS.income },
    { name: "Event Expenses", amount: financialStats.eventExpenses, fill: CHART_COLORS.expense },
    { name: "Asset Expenses", amount: financialStats.assetExpenses, fill: CHART_COLORS.asset },
    { name: "Office Expenses", amount: financialStats.officeExpenses, fill: CHART_COLORS.inProgress },
  ];

  const comparisonChartData = [
    {
      name: "Events",
      left: leftEventStats.total,
      right: rightEventStats.total,
      isCount: true,
    },
    {
      name: "Income",
      left: leftFinancialStats.income,
      right: rightFinancialStats.income,
      isCurrency: true,
    },
    {
      name: "Expenses",
      left: leftFinancialStats.totalExpenses,
      right: rightFinancialStats.totalExpenses,
      isCurrency: true,
    },
    {
      name: "Assets",
      left: leftAssetStats.count,
      right: rightAssetStats.count,
      isCount: true,
    },
  ];

  const isLoading = eventsLoading || expensesLoading || assetsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold" data-testid="heading-reports">Reports</h1>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[130px]" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="section-events-overview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold" data-testid="stat-completed">{eventStats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold" data-testid="stat-in-progress">{eventStats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold" data-testid="stat-missed">{eventStats.missed}</p>
                <p className="text-sm text-muted-foreground">Inquiry</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {eventChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-financial-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                <TrendingUp className="h-5 w-5 mb-2 text-green-600" />
                <p className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="stat-income">
                  {formatCurrency(financialStats.income)}
                </p>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
                <TrendingDown className="h-5 w-5 mb-2 text-red-600" />
                <p className="text-xl font-bold text-red-700 dark:text-red-400" data-testid="stat-expenses">
                  {formatCurrency(financialStats.totalExpenses)}
                </p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event Expenses</span>
                <span>{formatCurrency(financialStats.eventExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset Expenses</span>
                <span>{formatCurrency(financialStats.assetExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Office Expenses</span>
                <span>{formatCurrency(financialStats.officeExpenses)}</span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {financialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-asset-investments">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Investments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold" data-testid="stat-assets-count">{assetStats.count}</p>
                <p className="text-sm text-muted-foreground">Assets Purchased</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold" data-testid="stat-assets-investment">
                  {formatCurrency(assetStats.totalInvestment)}
                </p>
                <p className="text-sm text-muted-foreground">Total Investment</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Assets", count: assetStats.count, investment: assetStats.totalInvestment / 1000 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Investment (₹K)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill={CHART_COLORS.asset} name="Assets Count" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="investment" fill={CHART_COLORS.inProgress} name="Investment (₹K)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-period-comparison">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Period Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <Select
                    value={leftMonth.toString()}
                    onValueChange={(v) => setLeftMonth(parseInt(v))}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 pr-2" data-testid="select-left-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Badge>
                <Badge variant="outline" className="font-normal">
                  <Select
                    value={leftYear.toString()}
                    onValueChange={(v) => setLeftYear(parseInt(v))}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 pr-2" data-testid="select-left-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Badge>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <Select
                    value={rightMonth.toString()}
                    onValueChange={(v) => setRightMonth(parseInt(v))}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 pr-2" data-testid="select-right-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Badge>
                <Badge variant="outline" className="font-normal">
                  <Select
                    value={rightYear.toString()}
                    onValueChange={(v) => setRightYear(parseInt(v))}
                  >
                    <SelectTrigger className="border-0 h-auto p-0 pr-2" data-testid="select-right-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-center">{MONTHS[leftMonth]} {leftYear}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Events</span>
                    <span className="font-medium">{leftEventStats.total}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Income</span>
                    <span className="font-medium">{formatCurrency(leftFinancialStats.income)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Expenses</span>
                    <span className="font-medium">{formatCurrency(leftFinancialStats.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Assets</span>
                    <span className="font-medium">{leftAssetStats.count}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-center">{MONTHS[rightMonth]} {rightYear}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Events</span>
                    <span className="font-medium">{rightEventStats.total}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Income</span>
                    <span className="font-medium">{formatCurrency(rightFinancialStats.income)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Expenses</span>
                    <span className="font-medium">{formatCurrency(rightFinancialStats.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Assets</span>
                    <span className="font-medium">{rightAssetStats.count}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return v.toString();
                  }} />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => {
                      const dataItem = props.payload;
                      if (dataItem.isCurrency) {
                        return [formatCurrency(value), name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="left" name={`${MONTHS[leftMonth].slice(0, 3)} ${leftYear}`} fill={CHART_COLORS.inProgress} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="right" name={`${MONTHS[rightMonth].slice(0, 3)} ${rightYear}`} fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
