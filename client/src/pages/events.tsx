import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/event-card";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");

  const eventsData = {
    completed: [
      {
        id: "1",
        eventName: "Birthday Celebration - Priya",
        eventDate: "2025-09-20",
        venue: "Riverside Garden, Pune",
        clientInfo: "Mrs. Meena Patel - 9123456789",
        eventStatus: "Completed",
        providedService: "Birthday Party",
        requirementCount: 4,
      },
    ],
    inquired: [
      {
        id: "2",
        eventName: "Corporate Annual Meet 2025",
        eventDate: "2025-12-10",
        venue: "Convention Center, Delhi",
        clientInfo: "TechCorp Solutions",
        eventStatus: "Inquired",
        providedService: "Corporate Event",
        requirementCount: 5,
      },
      {
        id: "3",
        eventName: "Product Launch Event",
        eventDate: "2025-11-25",
        venue: "Tech Hub, Bangalore",
        clientInfo: "StartupX Innovations",
        eventStatus: "Inquired",
        providedService: "Product Launch",
        requirementCount: 6,
      },
    ],
    inProgress: [
      {
        id: "4",
        eventName: "Wedding Reception - Sharma Family",
        eventDate: "2025-11-15",
        venue: "Grand Palace Hotel, Mumbai",
        clientInfo: "Mr. Rajesh Sharma - 9876543210",
        eventStatus: "In Progress",
        providedService: "Wedding Planning",
        requirementCount: 8,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your events
          </p>
        </div>
        <Button data-testid="button-add-event">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-events"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-events">All Events</TabsTrigger>
          <TabsTrigger value="inquired" data-testid="tab-inquired">Inquired</TabsTrigger>
          <TabsTrigger value="inProgress" data-testid="tab-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...eventsData.completed, ...eventsData.inquired, ...eventsData.inProgress].map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => console.log(`View event ${event.id}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inquired" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsData.inquired.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => console.log(`View event ${event.id}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inProgress" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsData.inProgress.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => console.log(`View event ${event.id}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsData.completed.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => console.log(`View event ${event.id}`)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
