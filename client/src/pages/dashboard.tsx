import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, DollarSign, Package, Users, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { EventCard } from "@/components/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Event, Asset, TeamMember, Expense, Requirement } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Fetch all data
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: assets = [] } = useQuery<Asset[]>({ queryKey: ["/api/assets"] });
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team"] });
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });

  // Fetch all requirements for all events
  const eventIds = events.map(e => e.id);
  const requirementQueries = useQuery<Requirement[]>({
    queryKey: ["/api/requirements", "all"],
    queryFn: async () => {
      const allRequirements = await Promise.all(
        eventIds.map(eventId => 
          fetch(`/api/events/${eventId}/requirements`).then(r => r.json())
        )
      );
      return allRequirements.flat();
    },
    enabled: eventIds.length > 0,
  });

  const allRequirements = requirementQueries.data || [];

  // Calculate upcoming events (next 30 days)
  const today = new Date();
  const next30Days = addDays(today, 30);
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.eventDate);
    return isAfter(eventDate, today) && isBefore(eventDate, next30Days);
  }).slice(0, 3);

  // Calculate active assets
  const activeAssets = assets.filter(a => a.status === "Active").length;

  // Calculate total revenue (sum of finalized quotes from completed events this month)
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const thisMonthRevenue = events
    .filter(e => {
      const eventDate = new Date(e.eventDate);
      return e.eventStatus === "Completed" && 
             isAfter(eventDate, thisMonthStart) && 
             isBefore(eventDate, thisMonthEnd) &&
             e.finalizedQuote;
    })
    .reduce((sum, e) => sum + parseFloat(e.finalizedQuote || "0"), 0);

  // Calculate expense trend for last 6 months
  const expenseData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return isAfter(expenseDate, monthStart) && isBefore(expenseDate, monthEnd);
    });

    const income = monthExpenses
      .filter(e => e.type === "Credit")
      .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
    
    const expense = monthExpenses
      .filter(e => e.type === "Debit")
      .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

    expenseData.push({
      month: format(monthDate, "MMM"),
      income: Math.round(income),
      expense: Math.round(expense),
    });
  }

  // Calculate requirement status summary
  const requirementStatus = [
    { 
      status: "To Do", 
      count: allRequirements.filter(r => r.requirementStatus === "To Do").length, 
      color: "bg-muted" 
    },
    { 
      status: "In Progress", 
      count: allRequirements.filter(r => r.requirementStatus === "In Progress").length, 
      color: "bg-chart-3" 
    },
    { 
      status: "Completed", 
      count: allRequirements.filter(r => r.requirementStatus === "Completed").length, 
      color: "bg-chart-2" 
    },
  ];

  const totalRequirements = allRequirements.length;

  // Count requirements per event for upcoming events
  const upcomingEventsWithCounts = upcomingEvents.map(event => ({
    ...event,
    requirementCount: allRequirements.filter(r => r.eventId === event.id).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your event management operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={Calendar}
          description="Next 30 days"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${thisMonthRevenue.toLocaleString('en-IN')}`}
          icon={DollarSign}
          description="This month"
        />
        <StatCard
          title="Active Assets"
          value={activeAssets}
          icon={Package}
          description="Available for use"
        />
        <StatCard
          title="Team Members"
          value={teamMembers.length}
          icon={Users}
          description="Currently active"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Income vs Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Requirement Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirementStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="font-medium">{item.status}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Requirements</span>
                <span className="font-semibold">{totalRequirements}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        {upcomingEventsWithCounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEventsWithCounts.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => setLocation(`/events/${event.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming events in the next 30 days
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
