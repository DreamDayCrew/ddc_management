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

export default function Dashboard() {
  const expenseData = [
    { month: "May", income: 180000, expense: 120000 },
    { month: "Jun", income: 220000, expense: 150000 },
    { month: "Jul", income: 195000, expense: 135000 },
    { month: "Aug", income: 240000, expense: 165000 },
    { month: "Sep", income: 210000, expense: 145000 },
    { month: "Oct", income: 245000, expense: 170000 },
  ];

  const upcomingEvents = [
    {
      id: "1",
      eventName: "Wedding Reception - Sharma Family",
      eventDate: "2025-11-15",
      venue: "Grand Palace Hotel",
      clientInfo: "Mr. Rajesh Sharma",
      eventStatus: "In Progress",
      providedService: "Wedding Planning",
      requirementCount: 8,
    },
    {
      id: "2",
      eventName: "Corporate Annual Meet 2025",
      eventDate: "2025-12-10",
      venue: "Convention Center",
      clientInfo: "TechCorp Solutions",
      eventStatus: "Inquired",
      providedService: "Corporate Event",
      requirementCount: 5,
    },
  ];

  const requirementStatus = [
    { status: "To Do", count: 12, color: "bg-muted" },
    { status: "In Progress", count: 8, color: "bg-chart-3" },
    { status: "Completed", count: 25, color: "bg-chart-2" },
  ];

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
          value={12}
          icon={Calendar}
          description="Next 30 days"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value="₹2,45,000"
          icon={DollarSign}
          description="This month"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Active Assets"
          value={48}
          icon={Package}
          description="Available for use"
        />
        <StatCard
          title="Team Members"
          value={8}
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
                <span className="font-semibold">45</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              onClick={() => console.log(`Navigate to event ${event.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
