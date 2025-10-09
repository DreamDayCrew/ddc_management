import { EventCard } from "../event-card";

export default function EventCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
      <EventCard
        id="1"
        eventName="Wedding Reception - Sharma Family"
        eventDate="2025-11-15"
        venue="Grand Palace Hotel, Mumbai"
        clientInfo="Mr. Rajesh Sharma - 9876543210"
        eventStatus="In Progress"
        providedService="Wedding Planning"
        requirementCount={8}
        onClick={() => console.log("Event clicked: 1")}
      />
      <EventCard
        id="2"
        eventName="Corporate Annual Meet 2025"
        eventDate="2025-12-10"
        venue="Convention Center, Delhi"
        clientInfo="TechCorp Solutions - contact@techcorp.com"
        eventStatus="Inquired"
        providedService="Corporate Event"
        requirementCount={5}
        onClick={() => console.log("Event clicked: 2")}
      />
      <EventCard
        id="3"
        eventName="Birthday Celebration - Priya"
        eventDate="2025-10-20"
        venue="Riverside Garden, Pune"
        clientInfo="Mrs. Meena Patel - 9123456789"
        eventStatus="Completed"
        providedService="Birthday Party"
        requirementCount={4}
        onClick={() => console.log("Event clicked: 3")}
      />
    </div>
  );
}
