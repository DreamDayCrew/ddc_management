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
import { ArrowLeft, Calendar, MapPin, User, DollarSign, Edit, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function EventDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [addRequirementOpen, setAddRequirementOpen] = useState(false);
  const [editRequirement, setEditRequirement] = useState<Requirement | null>(null);
  const [deleteRequirement, setDeleteRequirement] = useState<Requirement | null>(null);
  const [addPlanRequirementId, setAddPlanRequirementId] = useState<string | null>(null);
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

  const requirementPlansQueries = requirements.map((req) => 
    useQuery<FulfillmentPlan[]>({
      queryKey: ["/api/requirements", req.id, "plans"],
    })
  );

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id, "requirements"] });
      requirements.forEach((req) => {
        queryClient.invalidateQueries({ queryKey: ["/api/requirements", req.id, "plans"] });
      });
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

  const getTeamMemberName = (id?: string | null) => {
    if (!id) return "N/A";
    return teamMembers.find((m) => m.id === id)?.name || "Unknown";
  };

  const getVendorName = (id?: string | null) => {
    if (!id) return "N/A";
    return vendors.find((v) => v.id === id)?.name || "Unknown";
  };

  const getAssetName = (id?: string | null) => {
    if (!id) return "N/A";
    return assets.find((a) => a.id === id)?.name || "Unknown";
  };

  if (eventLoading || requirementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Event not found</p>
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
            .map((requirement, index) => {
              const plansData = requirementPlansQueries[index]?.data || [];
              return (
                <AccordionItem
                  key={requirement.id}
                  value={requirement.id}
                  className="border rounded-lg px-4"
                  data-testid={`requirement-item-${requirement.id}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">#{requirement.order}</Badge>
                        <span className="font-medium" data-testid={`requirement-text-${requirement.id}`}>
                          {requirement.requirement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-chart-1 text-white" data-testid={`requirement-status-${requirement.id}`}>
                          {requirement.requirementStatus}
                        </Badge>
                        {requirement.requirementOwner && (
                          <Badge variant="outline" data-testid={`requirement-owner-${requirement.id}`}>
                            {requirement.requirementOwner}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex gap-2">
                      <Dialog
                        open={editRequirement?.id === requirement.id}
                        onOpenChange={(open) => !open && setEditRequirement(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRequirement(requirement)}
                            data-testid={`button-edit-requirement-${requirement.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Requirement</DialogTitle>
                          </DialogHeader>
                          <RequirementForm
                            requirement={requirement}
                            eventId={id!}
                            onSuccess={() => setEditRequirement(null)}
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteRequirement(requirement)}
                        data-testid={`button-delete-requirement-${requirement.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>

                      <Dialog
                        open={addPlanRequirementId === requirement.id}
                        onOpenChange={(open) => !open && setAddPlanRequirementId(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setAddPlanRequirementId(requirement.id)}
                            data-testid={`button-add-plan-${requirement.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Fulfillment Plan</DialogTitle>
                          </DialogHeader>
                          <FulfillmentForm
                            requirementId={requirement.id}
                            eventId={id!}
                            onSuccess={() => setAddPlanRequirementId(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Fulfillment Plans</h4>
                      {plansData.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No fulfillment plans added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {plansData.map((plan) => (
                            <Card key={plan.id} className="p-3" data-testid={`plan-item-${plan.id}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" data-testid={`plan-type-${plan.id}`}>{plan.planType}</Badge>
                                    <Badge className="bg-chart-1 text-white" data-testid={`plan-status-${plan.id}`}>
                                      {plan.planStatus}
                                    </Badge>
                                  </div>
                                  {plan.planType === "Team" && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Team: </span>
                                      <span data-testid={`plan-team-${plan.id}`}>
                                        {getTeamMemberName(plan.teamMemberId)} ({plan.teamRole})
                                      </span>
                                    </div>
                                  )}
                                  {plan.planType === "Vendor" && (
                                    <div className="text-sm space-y-1">
                                      <div>
                                        <span className="text-muted-foreground">Vendor: </span>
                                        <span data-testid={`plan-vendor-${plan.id}`}>
                                          {getVendorName(plan.vendorId)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Amount: </span>
                                        <span data-testid={`plan-amount-${plan.id}`}>
                                          ₹{parseFloat(plan.vendorAmount || "0").toFixed(2)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Payment: </span>
                                        <Badge variant="outline" data-testid={`plan-payment-${plan.id}`}>
                                          {plan.vendorPaymentStatus}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                  {plan.planType === "Asset" && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Asset: </span>
                                      <span data-testid={`plan-asset-${plan.id}`}>
                                        {getAssetName(plan.assetId)} ({plan.assetPurchaseStatus})
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Dialog
                                    open={editPlan?.plan.id === plan.id}
                                    onOpenChange={(open) => !open && setEditPlan(null)}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditPlan({ plan, requirementId: requirement.id })}
                                        data-testid={`button-edit-plan-${plan.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Fulfillment Plan</DialogTitle>
                                      </DialogHeader>
                                      <FulfillmentForm
                                        plan={plan}
                                        requirementId={requirement.id}
                                        eventId={id!}
                                        onSuccess={() => setEditPlan(null)}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletePlan(plan)}
                                    data-testid={`button-delete-plan-${plan.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
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
