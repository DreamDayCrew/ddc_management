import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { TeamMemberCard } from "@/components/team-member-card";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");

  const teamData = [
    {
      id: "1",
      name: "Rajesh Kumar",
      designation: "Event Manager",
    },
    {
      id: "2",
      name: "Priya Sharma",
      designation: "Designer",
    },
    {
      id: "3",
      name: "Amit Patel",
      designation: "Coordinator",
    },
    {
      id: "4",
      name: "Sneha Reddy",
      designation: "Marketing Lead",
    },
    {
      id: "5",
      name: "Vikram Singh",
      designation: "Technical Support",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your internal team members
          </p>
        </div>
        <Button data-testid="button-add-team-member">
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-team"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teamData.map((member) => (
          <TeamMemberCard
            key={member.id}
            {...member}
            onEdit={() => console.log(`Edit team member ${member.id}`)}
            onDelete={() => console.log(`Delete team member ${member.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
