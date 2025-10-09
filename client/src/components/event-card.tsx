import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  clientInfo: string;
  eventStatus: string;
  providedService: string;
  requirementCount?: number;
  onClick?: () => void;
}

export function EventCard({
  id,
  eventName,
  eventDate,
  venue,
  clientInfo,
  eventStatus,
  providedService,
  requirementCount = 0,
  onClick,
}: EventCardProps) {
  const statusColors: Record<string, string> = {
    Completed: "bg-chart-2 text-white",
    "In Progress": "bg-chart-3 text-white",
    Inquired: "bg-chart-1 text-white",
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all" 
      onClick={onClick}
      data-testid={`event-card-${id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate" data-testid={`event-name-${id}`}>
            {eventName}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{providedService}</p>
        </div>
        <Badge className={statusColors[eventStatus] || "bg-muted"} data-testid={`event-status-${id}`}>
          {eventStatus}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span data-testid={`event-date-${id}`}>
            {format(new Date(eventDate), "MMM dd, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="truncate" data-testid={`event-venue-${id}`}>{venue}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate" data-testid={`event-client-${id}`}>{clientInfo}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {requirementCount} requirement{requirementCount !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" data-testid={`button-view-event-${id}`}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
