import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Event, type Requirement, type Configuration } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download, Loader2, CalendarDays, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventForm } from "@/components/forms/event-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { subMonths, format } from "date-fns";

const EVENT_STATUSES = ["Inquired", "In Progress", "Completed"];
const PAYMENT_STATUSES = ["Pending", "Partial", "Paid"];

type DateFilter = "all" | "1month" | "3months" | "6months" | "custom";

const FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "1month", label: "Last Month" },
  { value: "3months", label: "3 Months" },
  { value: "6months", label: "6 Months" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

function buildEventsUrl(dateFilter: DateFilter, customStart: string, customEnd: string): string {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  switch (dateFilter) {
    case "1month": return `/api/events?startDate=${fmt(subMonths(today, 1))}&endDate=${fmt(today)}`;
    case "3months": return `/api/events?startDate=${fmt(subMonths(today, 3))}&endDate=${fmt(today)}`;
    case "6months": return `/api/events?startDate=${fmt(subMonths(today, 6))}&endDate=${fmt(today)}`;
    case "custom":
      if (customStart && customEnd) return `/api/events?startDate=${customStart}&endDate=${customEnd}`;
      return "/api/events";
    default: return "/api/events";
  }
}

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
  const [downloadFilters, setDownloadFilters] = useState({
    serviceType: "all",
    eventStatus: "all",
    paymentStatus: "all",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<DateFilter>("3months");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const eventsUrl = useMemo(
    () => buildEventsUrl(dateFilter, customStartDate, customEndDate),
    [dateFilter, customStartDate, customEndDate],
  );

  const { data: configuration } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: [eventsUrl],
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
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        event.eventName.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        (event.clientName || '').toLowerCase().includes(query) ||
        event.providedService.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

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
        serviceType: downloadFilters.serviceType,
        eventStatus: downloadFilters.eventStatus,
        paymentStatus: downloadFilters.paymentStatus,
      });

      const response = await fetch(`/api/events/pdf?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const statusLabel = downloadFilters.eventStatus === "all" ? "All" : downloadFilters.eventStatus;
      a.download = `Events_${statusLabel}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Events list has been downloaded.",
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

  const handleFilterChange = (value: DateFilter) => {
    setDateFilter(value);
    if (value !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Download Events Report</DialogTitle>
                <DialogDescription>
                  Filter events and select what information to include
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Filter Events</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="serviceType" className="text-xs text-muted-foreground">Service Type</Label>
                      <Select
                        value={downloadFilters.serviceType}
                        onValueChange={(value) => setDownloadFilters(prev => ({ ...prev, serviceType: value }))}
                      >
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          {configuration?.servicesProvided?.map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="eventStatus" className="text-xs text-muted-foreground">Event Status</Label>
                      <Select
                        value={downloadFilters.eventStatus}
                        onValueChange={(value) => setDownloadFilters(prev => ({ ...prev, eventStatus: value }))}
                      >
                        <SelectTrigger data-testid="select-event-status">
                          <SelectValue placeholder="Select event status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {EVENT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="paymentStatus" className="text-xs text-muted-foreground">Payment Status</Label>
                      <Select
                        value={downloadFilters.paymentStatus}
                        onValueChange={(value) => setDownloadFilters(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger data-testid="select-payment-status">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Payment Statuses</SelectItem>
                          {PAYMENT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-sm font-medium">Include Information</Label>
                  <p className="text-xs text-muted-foreground">
                    Event Name and Service Provided are always included.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="customerInfo"
                        checked={downloadOptions.customerInfo}
                        onCheckedChange={(checked) =>
                          setDownloadOptions((prev) => ({ ...prev, customerInfo: !!checked }))
                        }
                        data-testid="checkbox-customer-info"
                      />
                      <Label htmlFor="customerInfo" className="text-sm cursor-pointer">
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
                      <Label htmlFor="eventInfo" className="text-sm cursor-pointer">
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
                      <Label htmlFor="paymentInfo" className="text-sm cursor-pointer">
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
                      <Label htmlFor="stats" className="text-sm cursor-pointer">
                        Service Statistics (Count by service type)
                      </Label>
                    </div>
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

      {/* Date Range Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Date Range</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
                dateFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {opt.value === "custom" && dateFilter === "custom" && customStartDate && customEndDate ? (
                <>{customStartDate} → {customEndDate}<X className="h-3 w-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setCustomStartDate(""); setCustomEndDate(""); }} /></>
              ) : opt.label}
            </button>
          ))}
        </div>
        {dateFilter === "custom" && (
          <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-xl border border-border/60">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</Label>
              <Input id="start-date" type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</Label>
              <Input id="end-date" type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-9" />
            </div>
            <button className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setCustomStartDate(""); setCustomEndDate(""); }}>
              <X className="h-3.5 w-3.5 mr-1 inline" />Clear
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
        </p>
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
