import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, ChevronRight, Link, DollarSign, FileCheck, HeartHandshake, HeartCrack, Meh, Smile, SmilePlus } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  clientName?: string | null;
  eventStatus: string;
  providedService: string;
  requirementCount?: number;
  source?: string | null;
  ddcCost?: string | null;
  finalizedQuote?: string | null;
  onClick?: () => void;
  discount?: string | null | undefined;
  discount_amount?: string | null | undefined;
  [key: string]: any; // Allow any additional props
}

export function EventCard({
  id,
  eventName,
  eventDate,
  venue,
  clientName,
  eventStatus,
  providedService,
  requirementCount = 0,
  source,
  ddcCost,
  finalizedQuote,
  discount,
  discount_amount,
  onClick,
}: EventCardProps) {
  // Debug logs
  console.log('EventCard props:', {
    id,
    ddcCost,
    finalizedQuote,
    eventName,
    eventStatus
  });

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
        <div className="flex items-center gap-2">
          {(() => {
            console.log('Before calulation', {finalizedQuote, ddcCost})
            // Parse string values to numbers, default to 0 if parsing fails
            const parseNumber = (value: any) => {
              if (typeof value === 'number') return value;
              if (typeof value === 'string') {
                const parsed = parseFloat(value.replace(/,/g, ''));
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            };
            
            const invoiceAmount = parseNumber(finalizedQuote);
            const ddcAmount = parseNumber(ddcCost);
            
            let difference = 0;
            if (invoiceAmount > 0) {
              difference = ((ddcAmount - invoiceAmount) / invoiceAmount) * 100;
            }
            
            // Determine which icon to show based on conditions
            let Icon = null;
            let tooltip = '';
            
            if (ddcAmount === 0 || isNaN(ddcAmount)) {
              Icon = <HeartHandshake color="#0df83c" className="h-5 w-5" />;
              tooltip = 'No DDC spending recorded yet';
            } else if (invoiceAmount === 0) {
              Icon = <DollarSign className="h-4 w-4 text-muted-foreground" />;
              tooltip = `DDC Cost: $${ddcAmount.toLocaleString()}`;
            } else if (difference >= 10) {
              Icon = <HeartCrack color="#e40c0c" className="h-5 w-5" />;
              tooltip = `Spending ${Math.abs(difference).toFixed(1)}% above quote — significant overspend`;
            } else if (difference > 0) {
              Icon = <Meh color="#e44d0c" className="h-5 w-5" />;
              tooltip = `Spending ${difference.toFixed(1)}% above quote — mild overspend`;
            } else if (difference >= -10) {
              Icon = <Smile color="#e0e40c" className="h-5 w-5" />;
              tooltip = `Within ${Math.abs(difference).toFixed(1)}% of quote — normal range`;
            } else {
              Icon = <SmilePlus color="#13d820" className="h-5 w-5" />;
              tooltip = `Spending ${Math.abs(difference).toFixed(1)}% below quote — good efficiency`;
            }
            
            return (
              <>
                {ddcCost !== null && Icon && (
                  <div title={tooltip} className="flex items-center">
                    {Icon}
                  </div>
                )}
                <Badge className={statusColors[eventStatus] || "bg-muted"} data-testid={`event-status-${id}`}>
                  {eventStatus}
                </Badge>
              </>
            );
          })()}
        </div>
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
          <span className="truncate" data-testid={`event-client-${id}`}>{clientName || 'No client'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium" data-testid={`event-source-${id}`}>{source || 'Direct'}</span>
        </div>
        {discount === 'true' && discount_amount && parseFloat(discount_amount) > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600 font-medium">
              Discount: ₹{parseFloat(discount_amount).toFixed(2)}
            </span>
          </div>
        )}
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
