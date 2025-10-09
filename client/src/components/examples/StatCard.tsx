import { Calendar, DollarSign, Package, Users } from "lucide-react";
import { StatCard } from "../stat-card";

export default function StatCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
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
  );
}
