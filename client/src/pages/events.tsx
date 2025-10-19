import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Event, type Requirement } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/event-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EventForm } from "@/components/forms/event-form";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Fetch requirements for all events to get counts
  const { data: allRequirements = [] } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
    enabled: events.length > 0,
  });

  // Create a map of event ID to requirement count
  const requirementCounts = allRequirements.reduce((acc, req) => {
    acc[req.eventId] = (acc[req.eventId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    return (
      event.eventName.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.clientName.toLowerCase().includes(query) ||
      event.providedService.toLowerCase().includes(query)
    );
  });

  const inquiredEvents = filteredEvents.filter((e) => e.eventStatus === "Inquired");
  const inProgressEvents = filteredEvents.filter((e) => e.eventStatus === "In Progress");
  const completedEvents = filteredEvents.filter((e) => e.eventStatus === "Completed");

  const handleEventClick = (eventId: string) => {
    setLocation(`/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your events
          </p>
        </div>
        <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-event">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
            </DialogHeader>
            <EventForm onSuccess={() => setAddEventOpen(false)} />
          </DialogContent>
        </Dialog>
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
          <TabsTrigger value="all" data-testid="tab-all-events">
            All Events ({filteredEvents.length})
          </TabsTrigger>
          <TabsTrigger value="inquired" data-testid="tab-inquired">
            Inquired ({inquiredEvents.length})
          </TabsTrigger>
          <TabsTrigger value="inProgress" data-testid="tab-in-progress">
            In Progress ({inProgressEvents.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No events found matching your search" : "No events yet. Create your first event!"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  requirementCount={requirementCounts[event.id] || 0}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inquired" className="mt-6">
          {inquiredEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No inquired events</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inquiredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  requirementCount={requirementCounts[event.id] || 0}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inProgress" className="mt-6">
          {inProgressEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No events in progress</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  requirementCount={requirementCounts[event.id] || 0}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No completed events</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  requirementCount={requirementCounts[event.id] || 0}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
