import { TeamMemberCard } from "../team-member-card";

export default function TeamMemberCardExample() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 p-6">
      <TeamMemberCard
        id="1"
        name="Rajesh Kumar"
        designation="Event Manager"
        onEdit={() => console.log("Edit team member 1")}
        onDelete={() => console.log("Delete team member 1")}
      />
      <TeamMemberCard
        id="2"
        name="Priya Sharma"
        designation="Designer"
        onEdit={() => console.log("Edit team member 2")}
        onDelete={() => console.log("Delete team member 2")}
      />
      <TeamMemberCard
        id="3"
        name="Amit Patel"
        designation="Coordinator"
        onEdit={() => console.log("Edit team member 3")}
        onDelete={() => console.log("Delete team member 3")}
      />
    </div>
  );
}
