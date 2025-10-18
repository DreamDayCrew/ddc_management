import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { 
  type Event, 
  type Requirement, 
  type FulfillmentPlan,
  type TeamMember,
  type Vendor,
  type Asset,
  type Configuration
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { InvoiceTemplate } from "@/components/invoice-template";
import { ArrowLeft, Calendar, MapPin, User, Edit, Plus, FileDown, Link, IndianRupee } from "lucide-react";
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

  // Fetch all plans for the current event's requirements
  const { data: allPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/plans'],
    select: (plans: any[]) => {
      const filteredPlans = plans.filter(plan => 
        requirements.some(req => req.id === plan.requirementId)
      );
      return filteredPlans;
    },
    enabled: requirements.length > 0,
  });

  const calculateDDCCost = () => {
    
    if (!allPlans || allPlans.length === 0) {
      return 0;
    }
    
    const total = allPlans.reduce((sum, plan, index) => {
      const payment = Number(plan.payment || 0);
      return sum + payment;
    }, 0);
    
    return total;
  };

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  // Generate invoice number based on event ID
  const generateInvoiceNumber = (eventId: string) => {
    const shortId = eventId.slice(0, 8).toUpperCase();
    return `INV${shortId}`;
  };

  const updateEventStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/events/${id}`, { eventStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      toast({
        title: "Success",
        description: "Event status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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
    mutationFn: async (variables: { planId: string; requirementId: string }) => {
      return await apiRequest("DELETE", `/api/plans/${variables.planId}`);
    },
    onSuccess: async (data, variables) => {
      try {
        // Invalidate and refetch both the plans and requirements data
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: ["/api/requirements", variables.requirementId, "plans"],
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({ 
            queryKey: ["/api/events", id, "requirements"],
            refetchType: 'active',
          })
        ]);
        
        // Also invalidate any other related queries
        await queryClient.invalidateQueries({
          queryKey: ["/api/plans"],
          refetchType: 'active',
        });
        
        // Close the delete confirmation dialog
        setDeletePlan(null);
        
        toast({
          title: "Success",
          description: "Fulfillment plan deleted successfully",
        });
      } catch (error) {
        console.error('Error refreshing data after deletion:', error);
        toast({
          title: "Error",
          description: "Plan was deleted but there was an error refreshing the data",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Delete plan error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletePlan(null); // Close the dialog
    }
  });

  const handleDeletePlan = (plan: FulfillmentPlan) => {
    setDeletePlan(plan);
  };

  const confirmDeletePlan = async () => {
    if (!deletePlan) return;
    
    console.log('Going to call delete', deletePlan);
    try {
      await deletePlanMutation.mutateAsync({ 
        planId: deletePlan.id, 
        requirementId: deletePlan.requirementId 
      });
    } catch (error) {
      console.error('Error in confirmDeletePlan:', error);
    }
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

  const calculateInvoiceValue = () => {
    // console.log('Current event ID:', id);
    // console.log('Requirements for event:', requirements);
    
    if (!requirements || requirements.length === 0) {
      // console.log('No requirements found for calculation');
      return 0;
    }
    
    const total = requirements.reduce((total, req) => {
      const price = Number(req.price) || 0;
      const quantity = Number(req.quantity) || 0;
      const itemTotal = price * quantity;
      // console.log(`Requirement: ${req.id}, Price: ${price}, Quantity: ${quantity}, Item Total: ${itemTotal}`);
      return total + itemTotal;
    }, 0);
    
    // console.log('Total calculated invoice value:', total);
    return total;
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
        <div className="flex gap-2">
          {config && (
            <PDFDownloadLink
              document={<InvoiceTemplate config={config} event={event} requirements={requirements} invoiceNumber={generateInvoiceNumber(event.id)} />}
              fileName={`Invoice_${event.eventName}_${format(new Date(), "yyyyMMdd")}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading} data-testid="button-generate-invoice">
                  <FileDown className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Invoice"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
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
              <EventForm 
                event={event} 
                invoiceAmount={calculateInvoiceValue()} 
                onSuccess={() => setEditEventOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
          <Accordion type="multiple" defaultValue={['basic-info', 'client-info', 'payment-info']}>
            {/* Basic Information Section */}
            <AccordionItem value="basic-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <Select
                    value={event.eventStatus}
                    onValueChange={(value) => updateEventStatusMutation.mutate(value)}
                    disabled={updateEventStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="select-event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Inquired", "In Progress", "Completed"].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <Link className="h-4 w-4" />
                      <span>Source</span>
                    </div>
                    <p className="font-medium" data-testid="event-client">{event.source || "N/A"}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Client Information Section */}
            <AccordionItem value="client-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium">Client Information</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Name</span>
                    </div>
                    <p className="font-medium" data-testid="event-client">{event.clientName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Contact Number</span>
                    </div>
                    <p className="font-medium" data-testid="client-phone">{event.clientPhone || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium" data-testid="client-email">{event.clientEmail || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Address</span>
                    </div>
                    <p className="font-medium" data-testid="client-address">{event.clientAddress || "N/A"}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Payment Information Section */}
            <AccordionItem value="payment-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium">Payment Information</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      <span>Invoice Value</span>
                    </div>
                    <p className="font-medium" data-testid="invoice-value">
                      {`₹${calculateInvoiceValue()}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      <span>DDC Spent</span>
                    </div>
                    <p className="font-medium" data-testid="ddc-cost">
                      {`₹${calculateDDCCost()}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Mode of Transaction</span>
                    </div>
                    <p className="font-medium" data-testid="payment-mode">{event.paymentMode || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Status</span>
                    </div>
                    <Badge variant="outline" data-testid="payment-status">{event.paymentStatus}</Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>

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
              onClick={confirmDeletePlan}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="confirm-delete-plan"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fulfillment Plan</DialogTitle>
          </DialogHeader>
          {editPlan && (
            <FulfillmentForm
              requirementId={editPlan.requirementId}
              eventId={id!}
              plan={editPlan.plan}
              onSuccess={() => setEditPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
