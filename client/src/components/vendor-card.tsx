import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Star, Edit } from "lucide-react";

interface VendorCardProps {
  id: string;
  name: string;
  category?: string | null;
  specialization?: string | null;
  location?: string | null;
  contactInfo?: string | null;
  rating?: number | null;
  onEdit?: () => void;
}

export function VendorCard({
  id,
  name,
  category,
  specialization,
  location,
  contactInfo,
  rating = 0,
  onEdit,
}: VendorCardProps) {
  return (
    <Card data-testid={`vendor-card-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base" data-testid={`vendor-name-${id}`}>{name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-vendor-${id}`}>
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {category && (
          <Badge variant="outline" data-testid={`vendor-category-${id}`}>{category}</Badge>
        )}
        {specialization && (
          <p className="text-sm text-muted-foreground">{specialization}</p>
        )}
        {location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`vendor-location-${id}`}>{location}</span>
          </div>
        )}
        {contactInfo && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`vendor-contact-${id}`}>{contactInfo}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < (rating || 0) ? "fill-chart-3 text-chart-3" : "text-muted-foreground"
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2" data-testid={`vendor-rating-${id}`}>
            ({rating || 0}/5)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
