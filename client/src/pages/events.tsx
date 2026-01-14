import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Event, type Requirement } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/event-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { EventForm } from "@/components/forms/event-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Helper function to get last 3 months range
const getLast3MonthsRange = () => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  return threeMonthsAgo;
};

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    customerInfo: true,
    eventInfo: true,
    paymentInfo: true,
    stats: true,
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const threeMonthsAgo = useMemo(getLast3MonthsRange, []);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    select: (data) => {
      // Filter to only show events from last 3 months based on event date
      return data.filter((event) => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= threeMonthsAgo;
      });
    },
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

  const filteredEvents = events
    .filter((event) => {
      const query = searchQuery.toLowerCase();
      return (
        event.eventName.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        (event.clientName || '').toLowerCase().includes(query) ||
        event.providedService.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Sort by eventDate (latest first)
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateB - dateA;
    });

  const inquiredEvents = filteredEvents.filter((e) => e.eventStatus === "Inquired");
  const inProgressEvents = filteredEvents.filter((e) => e.eventStatus === "In Progress");
  const completedEvents = filteredEvents.filter((e) => e.eventStatus === "Completed");

  const handleEventClick = (eventId: string) => {
    setLocation(`/events/${eventId}`);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        customerInfo: downloadOptions.customerInfo.toString(),
        eventInfo: downloadOptions.eventInfo.toString(),
        paymentInfo: downloadOptions.paymentInfo.toString(),
        stats: downloadOptions.stats.toString(),
      });

      const response = await fetch(`/api/events/completed/pdf?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Completed_Events_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Completed events list has been downloaded.",
      });
      setDownloadOpen(false);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download event list",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
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
        <div className="flex items-center gap-2">
          <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-download-events">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download Completed Events</DialogTitle>
                <DialogDescription>
                  Select what information to include in the PDF download
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Event Name and Service Provided are always included.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customerInfo"
                      checked={downloadOptions.customerInfo}
                      onCheckedChange={(checked) =>
                        setDownloadOptions((prev) => ({ ...prev, customerInfo: !!checked }))
                      }
                      data-testid="checkbox-customer-info"
                    />
                    <Label htmlFor="customerInfo" className="text-sm font-medium cursor-pointer">
                      Customer Info (Name, Phone, Email, Address)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eventInfo"
                      checked={downloadOptions.eventInfo}
                      onCheckedChange={(checked) =>
                        setDownloadOptions((prev) => ({ ...prev, eventInfo: !!checked }))
                      }
                      data-testid="checkbox-event-info"
                    />
                    <Label htmlFor="eventInfo" className="text-sm font-medium cursor-pointer">
                      Event Info (Venue, Event Date, Status)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paymentInfo"
                      checked={downloadOptions.paymentInfo}
                      onCheckedChange={(checked) =>
                        setDownloadOptions((prev) => ({ ...prev, paymentInfo: !!checked }))
                      }
                      data-testid="checkbox-payment-info"
                    />
                    <Label htmlFor="paymentInfo" className="text-sm font-medium cursor-pointer">
                      Payment Info (Invoice Value, Payment Status, DDC Spent)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stats"
                      checked={downloadOptions.stats}
                      onCheckedChange={(checked) =>
                        setDownloadOptions((prev) => ({ ...prev, stats: !!checked }))
                      }
                      data-testid="checkbox-stats"
                    />
                    <Label htmlFor="stats" className="text-sm font-medium cursor-pointer">
                      Service Statistics (Count by service type)
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDownloadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDownloadPdf} disabled={downloading} data-testid="button-confirm-download">
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
