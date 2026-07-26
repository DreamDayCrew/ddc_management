import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileDown,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { PeriodReportPdf, type PeriodReportData } from "@/components/period-report-pdf";
import type { Event, Expense, Asset, Configuration } from "@shared/schema";

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

// ── Period Report helpers ──────────────────────────────────────────────────

type PeriodKey = "thisYear" | "lastYear" | "last6m" | "last3m" | "custom";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "last6m", label: "Last 6 Months" },
  { value: "last3m", label: "Last 3 Months" },
  { value: "custom", label: "Custom" },
];

function buildPeriodRange(key: PeriodKey, customStart: string, customEnd: string) {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const fmtDisplay = (d: Date) => format(d, "dd MMM yyyy");
  switch (key) {
    case "thisYear": {
      const s = startOfYear(today); const e = endOfYear(today);
      return { startDate: fmt(s), endDate: fmt(e), label: `${format(today, "yyyy")} (Full Year)` };
    }
    case "lastYear": {
      const prev = subYears(today, 1); const s = startOfYear(prev); const e = endOfYear(prev);
      return { startDate: fmt(s), endDate: fmt(e), label: `${format(prev, "yyyy")} (Full Year)` };
    }
    case "last6m": {
      const s = subMonths(today, 6);
      return { startDate: fmt(s), endDate: fmt(today), label: `${fmtDisplay(s)} – ${fmtDisplay(today)}` };
    }
    case "last3m": {
      const s = subMonths(today, 3);
      return { startDate: fmt(s), endDate: fmt(today), label: `${fmtDisplay(s)} – ${fmtDisplay(today)}` };
    }
    case "custom":
      if (customStart && customEnd) {
        return { startDate: customStart, endDate: customEnd, label: `${fmtDisplay(new Date(customStart))} – ${fmtDisplay(new Date(customEnd))}` };
      }
      return { startDate: fmt(startOfYear(today)), endDate: fmt(today), label: "Custom Range" };
  }
}

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

  // Period report state
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("thisYear");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  const { startDate: pStartDate, endDate: pEndDate, label: periodLabel } = useMemo(
    () => buildPeriodRange(activePeriod, customStart, customEnd),
    [activePeriod, customStart, customEnd],
  );
  const periodUrl = `/api/reports/period?startDate=${pStartDate}&endDate=${pEndDate}`;

  const { data: periodData, isLoading: periodLoading } = useQuery<PeriodReportData>({
    queryKey: [periodUrl],
  });
  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });
  const filteredPeriodEvents = useMemo(() => {
    if (!periodData) return [];
    if (!eventSearch) return periodData.events;
    const q = eventSearch.toLowerCase();
    return periodData.events.filter(
      (e) => e.eventName.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.service.toLowerCase().includes(q),
    );
  }, [periodData, eventSearch]);

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
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="heading-reports">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Financial and event performance analysis</p>
      </div>

      <Tabs defaultValue="period" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="period" className="flex-1 sm:flex-none gap-2">
            <BarChart3 className="h-4 w-4" />Period Report
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 sm:flex-none gap-2">
            <Calendar className="h-4 w-4" />Monthly Report
          </TabsTrigger>
        </TabsList>

        {/* ── Period Report Tab ───────────────────────────────────── */}
        <TabsContent value="period" className="mt-6 space-y-6">
          {/* Period selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Select Period</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PERIOD_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { setActivePeriod(opt.value); if (opt.value !== "custom") { setCustomStart(""); setCustomEnd(""); } }}
                  className={cn("flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
                    activePeriod === opt.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >{opt.label}</button>
              ))}
            </div>
            {activePeriod === "custom" && (
              <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-xl border border-border/60">
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</Label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</Label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9" />
                </div>
                <button className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setCustomStart(""); setCustomEnd(""); }}>
                  <X className="h-3.5 w-3.5 mr-1 inline" />Clear
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{periodLabel}</Badge>
                {periodData && <span className="text-xs text-muted-foreground">{periodData.summary.totalEvents} event{periodData.summary.totalEvents !== 1 ? "s" : ""}</span>}
              </div>
              {periodData && config && (
                <PDFDownloadLink document={<PeriodReportPdf data={periodData} config={config} periodLabel={periodLabel} />} fileName={`period-report-${pStartDate}-to-${pEndDate}.pdf`}>
                  {({ loading }) => (
                    <Button size="sm" disabled={loading} className="gap-2 shrink-0">
                      <FileDown className="h-4 w-4" />{loading ? "Preparing PDF…" : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>

          {periodLoading && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[1,2,3,4].map((i) => (<Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-32" /></CardContent></Card>))}
            </div>
          )}

          {!periodLoading && periodData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(periodData.summary.totalRevenue), sub: "completed events", color: "text-green-600 dark:text-green-400", icon: <DollarSign className="h-4 w-4" /> },
                  { label: "Total Income", value: formatCurrency(periodData.summary.totalCredits), sub: "credits received", color: "text-blue-600 dark:text-blue-400", icon: <TrendingUp className="h-4 w-4" /> },
                  { label: "Total Expenses", value: formatCurrency(periodData.summary.totalDebits), sub: "debits paid", color: "text-red-600 dark:text-red-400", icon: <TrendingDown className="h-4 w-4" /> },
                  { label: "Net Profit", value: formatCurrency(periodData.summary.netProfit), sub: "income − expenses", color: "", icon: <BarChart3 className="h-4 w-4" />, dark: true },
                ].map((s) => (
                  <Card key={s.label} className={cn(s.dark && "bg-foreground text-background border-0")}>
                    <CardContent className="p-4">
                      <p className={cn("text-xs uppercase tracking-wide mb-1", s.dark ? "text-muted-foreground/60" : "text-muted-foreground")}>{s.label}</p>
                      <p className={cn("text-xl font-bold tabular-nums truncate", s.dark ? "text-background" : s.color)}>{s.value}</p>
                      <p className={cn("text-xs mt-1", s.dark ? "text-muted-foreground/60" : "text-muted-foreground")}>{s.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: periodData.summary.totalEvents, bg: "bg-muted/50", tc: "" },
                  { label: "Completed", value: periodData.summary.completedEvents, bg: "bg-green-50 dark:bg-green-950/30", tc: "text-green-700 dark:text-green-400" },
                  { label: "In Progress", value: periodData.summary.inProgressEvents, bg: "bg-amber-50 dark:bg-amber-950/30", tc: "text-amber-700 dark:text-amber-400" },
                  { label: "Inquired", value: periodData.summary.inquiredEvents, bg: "bg-blue-50 dark:bg-blue-950/30", tc: "text-blue-700 dark:text-blue-400" },
                ].map((item) => (
                  <div key={item.label} className={cn("rounded-xl p-4 border", item.bg)}>
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={cn("text-3xl font-bold", item.tc)}>{item.value}</p>
                  </div>
                ))}
              </div>

              {periodData.events.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <CardTitle className="text-base">Event Breakdown</CardTitle>
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Search events…" value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} className="pl-8 h-8 text-sm" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Service</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Quote</th>
                        </tr></thead>
                        <tbody>
                          {filteredPeriodEvents.map((ev, i) => (
                            <tr key={ev.id} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/20")}>
                              <td className="p-3"><p className="font-medium leading-tight">{ev.eventName}</p><p className="text-xs text-muted-foreground mt-0.5">{ev.venue}</p></td>
                              <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(ev.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{ev.service}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={cn("text-xs",
                                  ev.status === "Completed" && "border-green-500 text-green-600 dark:text-green-400",
                                  ev.status === "In Progress" && "border-amber-500 text-amber-600 dark:text-amber-400",
                                  ev.status === "Inquired" && "border-blue-500 text-blue-600 dark:text-blue-400",
                                )}>{ev.status}</Badge>
                              </td>
                              <td className="p-3 text-right font-medium tabular-nums">{ev.quote > 0 ? formatCurrency(ev.quote) : <span className="text-muted-foreground">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="sm:hidden divide-y">
                      {filteredPeriodEvents.map((ev) => (
                        <div key={ev.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0"><p className="font-medium text-sm truncate">{ev.eventName}</p><p className="text-xs text-muted-foreground">{ev.venue}</p></div>
                            <Badge variant="outline" className={cn("text-xs shrink-0",
                              ev.status === "Completed" && "border-green-500 text-green-600",
                              ev.status === "In Progress" && "border-amber-500 text-amber-600",
                              ev.status === "Inquired" && "border-blue-500 text-blue-600",
                            )}>{ev.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(ev.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            <span>{ev.service}</span>
                            <span className="font-semibold text-foreground tabular-nums">{ev.quote > 0 ? formatCurrency(ev.quote) : "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredPeriodEvents.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No events match your search</div>}
                  </CardContent>
                </Card>
              )}

              {periodData.topServices.length > 0 && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Services Breakdown</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {periodData.topServices.map((svc) => {
                      const maxRev = Math.max(...periodData.topServices.map((s) => s.revenue), 1);
                      const pct = maxRev > 0 ? (svc.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={svc.service}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium">{svc.service}</span>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>{svc.count} event{svc.count !== 1 ? "s" : ""}</span>
                              <span className="font-semibold text-foreground tabular-nums">{svc.revenue > 0 ? formatCurrency(svc.revenue) : "—"}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Income & Expense Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 p-4">
                  {[
                    { label: "Total Credits (Income)", value: periodData.expenseSummary.totalCredits, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
                    { label: "Total Debits (Expenses)", value: periodData.expenseSummary.totalDebits, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
                    { label: "Transfers", value: periodData.expenseSummary.totalTransfers, color: "text-foreground", bg: "bg-muted/30" },
                  ].map((row) => (
                    <div key={row.label} className={cn("flex items-center justify-between rounded-lg px-4 py-3", row.bg)}>
                      <span className="text-sm">{row.label}</span>
                      <span className={cn("font-semibold tabular-nums", row.color)}>{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-foreground text-background mt-2">
                    <span className="text-sm font-semibold">Net Profit / Loss</span>
                    <span className={cn("font-bold tabular-nums text-lg", periodData.summary.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                      {periodData.summary.netProfit >= 0 ? "+" : ""}{formatCurrency(periodData.summary.netProfit)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {periodData.summary.totalEvents === 0 && (
                <Card><CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-center">No events found for this period. Try a different range.</p>
                </CardContent></Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Monthly Report Tab ──────────────────────────────────── */}
        <TabsContent value="monthly" className="mt-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Monthly Report</h2>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
