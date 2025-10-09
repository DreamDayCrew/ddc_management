import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  type Event, 
  type Requirement, 
  type FulfillmentPlan,
  type TeamMember,
  type Vendor,
  type Asset
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventForm } from "@/components/forms/event-form";
import { RequirementForm } from "@/components/forms/requirement-form";
import { FulfillmentForm } from "@/components/forms/fulfillment-form";
import { RequirementItem } from "@/components/requirement-item";
import { ArrowLeft, Calendar, MapPin, User, DollarSign, Edit, Plus } from "lucide-react";
import { format } from "date-fns";

export default function EventDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [addRequirementOpen, setAddRequirementOpen] = useState(false);
  const [deleteRequirement, setDeleteRequirement] = useState<Requirement | null>(null);
  const [editPlan, setEditPlan] = useState<{ plan: FulfillmentPlan; requirementId: string } | null>(null);
  const [deletePlan, setDeletePlan] = useState<FulfillmentPlan | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", id],
  });

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery<Requirement[]>({
    queryKey: ["/api/events", id, "requirements"],
    enabled: !!id,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (reqId: string) => {
      await apiRequest("DELETE", `/api/requirements/${reqId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement deleted successfully",
      });
      setDeleteRequirement(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("DELETE", `/api/plans/${planId}`);
    },
    onSuccess: (_data, _variables, context: any) => {
      if (context?.requirementId) {
        queryClient.invalidateQueries({ queryKey: ["/api/requirements", context.requirementId, "plans"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/events", id, "requirements"] });
      toast({
        title: "Success",
        description: "Fulfillment plan deleted successfully",
      });
      setDeletePlan(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (eventLoading || requirementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => setLocation("/")} data-testid="button-back-to-dashboard">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Completed: "bg-chart-2 text-white",
    "In Progress": "bg-chart-3 text-white",
    Inquired: "bg-chart-1 text-white",
  };

  const profitLoss = parseFloat(event.profitLoss || "0");
  const isProfitable = profitLoss >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/events")}
          data-testid="button-back-to-events"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="event-details-title">{event.eventName}</h1>
          <p className="text-muted-foreground mt-1">{event.providedService}</p>
        </div>
        <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-edit-event">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <EventForm event={event} onSuccess={() => setEditEventOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-lg">Event Information</CardTitle>
          <Badge className={statusColors[event.eventStatus] || "bg-muted"} data-testid="event-status-badge">
            {event.eventStatus}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Event Date</span>
            </div>
            <p className="font-medium" data-testid="event-date">
              {format(new Date(event.eventDate), "MMM dd, yyyy")}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Registered On</span>
            </div>
            <p className="font-medium" data-testid="registered-on">
              {format(new Date(event.registeredOn), "MMM dd, yyyy")}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Venue</span>
            </div>
            <p className="font-medium" data-testid="event-venue">{event.venue}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Client</span>
            </div>
            <p className="font-medium" data-testid="event-client">{event.clientInfo}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Initial Quote</span>
            </div>
            <p className="font-medium" data-testid="initial-quote">
              {event.initialQuote ? `₹${parseFloat(event.initialQuote).toFixed(2)}` : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Finalized Quote</span>
            </div>
            <p className="font-medium" data-testid="finalized-quote">
              {event.finalizedQuote ? `₹${parseFloat(event.finalizedQuote).toFixed(2)}` : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>DDC Cost</span>
            </div>
            <p className="font-medium" data-testid="ddc-cost">
              {event.ddcCost ? `₹${parseFloat(event.ddcCost).toFixed(2)}` : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Profit/Loss</span>
            </div>
            <p className={`font-medium ${isProfitable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="profit-loss">
              {isProfitable ? "+" : ""}₹{profitLoss.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Payment Mode</span>
            </div>
            <p className="font-medium" data-testid="payment-mode">{event.paymentMode || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Payment Status</span>
            </div>
            <Badge variant="outline" data-testid="payment-status">{event.paymentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Requirements</h2>
        <Dialog open={addRequirementOpen} onOpenChange={setAddRequirementOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-requirement">
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Requirement</DialogTitle>
            </DialogHeader>
            <RequirementForm eventId={id!} onSuccess={() => setAddRequirementOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No requirements added yet</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {requirements
            .sort((a, b) => a.order - b.order)
            .map((requirement) => (
              <RequirementItem
                key={requirement.id}
                requirement={requirement}
                eventId={id!}
                teamMembers={teamMembers}
                vendors={vendors}
                assets={assets}
                onDelete={setDeleteRequirement}
                onEditPlan={(plan, requirementId) => setEditPlan({ plan, requirementId })}
                onDeletePlan={setDeletePlan}
              />
            ))}
        </Accordion>
      )}

      <AlertDialog open={!!deleteRequirement} onOpenChange={(open) => !open && setDeleteRequirement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requirement? This will also delete all associated fulfillment plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-requirement">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequirement && deleteRequirementMutation.mutate(deleteRequirement.id)}
              data-testid="button-confirm-delete-requirement"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePlan} onOpenChange={(open) => !open && setDeletePlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fulfillment Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fulfillment plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-plan">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlan && deletePlanMutation.mutate(deletePlan.id)}
              data-testid="button-confirm-delete-plan"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
