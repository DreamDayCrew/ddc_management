import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  type Requirement,
  type FulfillmentPlan,
  type TeamMember,
  type Vendor,
  type Asset,
  type Configuration,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
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
import { RequirementForm } from "@/components/forms/requirement-form";
import { FulfillmentForm } from "@/components/forms/fulfillment-form";
import { Edit, Plus, Trash2, IndianRupee, Star, MessageSquare } from "lucide-react";

interface RequirementItemProps {
  requirement: Requirement;
  eventId: string;
  teamMembers: TeamMember[];
  vendors: Vendor[];
  assets: Asset[];
  onDelete: (requirement: Requirement) => void;
  onEditPlan: (plan: FulfillmentPlan, requirementId: string) => void;
  onDeletePlan: (plan: FulfillmentPlan) => void;
  isEventCompleted?: boolean;
}

function StarRating({ 
  rating, 
  onChange, 
  disabled = false,
  label 
}: { 
  rating: number | null; 
  onChange: (rating: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground min-w-[80px]">{label}:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`p-0.5 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-yellow-400'}`}
          >
            <Star
              className={`h-4 w-4 ${
                rating && star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
      {rating && <span className="text-xs text-muted-foreground">({rating}/5)</span>}
    </div>
  );
}

type FulfillmentPlanWithRequirement = FulfillmentPlan & {
  requirementId: string;
};

export function RequirementItem({
  requirement,
  eventId,
  teamMembers,
  vendors,
  assets,
  onDelete,
  onEditPlan,
  onDeletePlan,
  isEventCompleted = false,
}: RequirementItemProps) {
  const { toast } = useToast();
  const [editRequirement, setEditRequirement] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [reviewingPlanId, setReviewingPlanId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: plans = [] } = useQuery<FulfillmentPlan[]>({
    queryKey: ["/api/requirements", requirement.id, "plans"],
  });

  const updatePlanReviewMutation = useMutation({
    mutationFn: async ({ planId, customerRating, teamRating, reviewNotes }: { 
      planId: string; 
      customerRating?: number | null; 
      teamRating?: number | null; 
      reviewNotes?: string | null;
    }) => {
      return await apiRequest("PATCH", `/api/plans/${planId}/review`, { 
        customerRating, 
        teamRating, 
        reviewNotes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirement.id, "plans"] });
      toast({
        title: "Success",
        description: "Review updated successfully",
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

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const updateRequirementStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/requirements/${requirement.id}`, { requirementStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement status updated successfully",
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

  const updatePlanStatusMutation = useMutation({
    mutationFn: async ({ planId, status }: { planId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/plans/${planId}`, { planStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", requirement.id, "plans"] });
      toast({
        title: "Success",
        description: "Fulfillment plan status updated successfully",
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

  const getTeamMemberName = (id: string | null) => {
    if (!id || !teamMembers || teamMembers.length === 0) return "Unassigned";
    const member = teamMembers.find((m) => m.id === id);
    return member?.name || `Unknown (${id})`;
  };

  const getVendorName = (id: string | null) => {
    if (!id) return "Unknown";
    const vendor = vendors.find((v) => v.id === id);
    return vendor?.name || "Unknown";
  };

  const getAssetName = (id: string | null) => {
    if (!id) return "Unknown";
    const asset = assets.find((a) => a.id === id);
    return asset?.name || "Unknown";
  };

  return (
    <AccordionItem
      value={requirement.id}
      className="border rounded-lg px-4"
      data-testid={`requirement-item-${requirement.id}`}
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium" data-testid={`requirement-text-${requirement.id}`}>
              {requirement.requirement}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="mr-1">Invoice:</span>
                <IndianRupee className="h-3 w-3" />
                <span>{requirement.order || 0}</span>
              </div>
              {requirement.req_discount === "true" && requirement.req_discount_amount && parseFloat(requirement.req_discount_amount) > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center text-orange-600">
                    <span className="mr-1">Discount:</span>
                    <IndianRupee className="h-3 w-3" />
                    <span>{parseFloat(requirement.req_discount_amount).toFixed(2)}</span>
                  </div>
                </>
              )}
              <span>•</span>
              <div className="flex items-center">
                <span className="mr-1">Total Spent:</span>
                <IndianRupee className="h-3 w-3" />
                <span>
                  {plans?.reduce((sum, plan) => {
                    const payment = Number(plan.payment || 0);
                    return sum + payment;
                  }, 0) || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {(() => {
                const invoiceAmount = parseFloat(requirement.order?.toString() || '0');
                const ddcSpent = plans?.reduce((total, plan) => {
                  return total + (parseFloat(plan.payment?.toString() || '0') || 0);
                }, 0) || 0;
                
                const variance = invoiceAmount - ddcSpent;
                const variancePercent = invoiceAmount > 0 ? (Math.abs(variance) / invoiceAmount) * 100 : 0;
                
                return (
                  <div className="text-right min-w-[100px]">
                    <p 
                      className={`text-sm font-medium leading-4 ${
                        variance >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                      data-testid={`variance-amount-${requirement.id}`}
                    >
                      {variance >= 0 ? "+" : "-"}
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(Math.abs(variance))}
                    </p>
                    <p 
                      className="text-xs text-muted-foreground leading-4"
                      title={variance >= 0 ? `Saved ${variancePercent.toFixed(1)}%` : `Over by ${variancePercent.toFixed(1)}%`}
                      data-testid={`variance-label-${requirement.id}`}
                    >
                      {variance >= 0 ? "saved" : "over"}
                    </p>
                  </div>
                );
              })()}
            </div>
            
            <div className="w-[140px]">
              <Select
                value={requirement.requirementStatus}
                onValueChange={(value) => updateRequirementStatusMutation.mutate(value)}
                disabled={updateRequirementStatusMutation.isPending}
              >
                <SelectTrigger className="h-8" data-testid={`select-requirement-status-${requirement.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["To Do", "In Progress", "Completed"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {requirement.requirementOwner && (
              <div className="min-w-[80px]">
                <Badge 
                  variant="outline" 
                  className="whitespace-nowrap"
                  data-testid={`requirement-owner-${requirement.id}`}
                >
                  {requirement.requirementOwner}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="flex gap-2">
          <Dialog open={editRequirement} onOpenChange={setEditRequirement}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
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
                eventId={eventId}
                onSuccess={() => setEditRequirement(false)}
                isEventCompleted={isEventCompleted}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(requirement)}
            data-testid={`button-delete-requirement-${requirement.id}`}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>

          <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid={`button-add-plan-${requirement.id}`}>
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
                eventId={eventId}
                onSuccess={() => setAddPlanOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Fulfillment Plans</h4>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No fulfillment plans added yet
            </p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-3" data-testid={`plan-item-${plan.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" data-testid={`plan-type-${plan.id}`}>
                          {plan.planType}
                        </Badge>
                        <Select
                          value={plan.planStatus}
                          onValueChange={(value) => updatePlanStatusMutation.mutate({ planId: plan.id, status: value })}
                          disabled={updatePlanStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[120px] h-7" data-testid={`select-plan-status-${plan.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config?.planStatuses?.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {plan.planType === "Team" && (
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Name: </span>
                            <span data-testid={`plan-team-${plan.id}`}>
                              {getTeamMemberName(plan.teamMemberId)} ({plan.teamRole})
                            </span>
                          </div>
                          {plan.payment && (
                            <div>
                              <div>
                                <span className="text-muted-foreground">Amount: </span>
                                <span data-testid={`plan-payment-amount-${plan.id}`}>
                                  ₹{parseFloat(plan.payment).toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Payment: </span>
                                <Badge variant="outline" data-testid={`plan-payment-${plan.id}`}>
                                  {plan.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          )}
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
                              ₹{parseFloat(plan.payment || "0").toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment: </span>
                            <Badge variant="outline" data-testid={`plan-payment-${plan.id}`}>
                              {plan.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {plan.planType === "Asset" && (
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Asset: </span>
                            {plan.assetType === "Inventory" && (                              
                                <span data-testid={`plan-asset-${plan.id}`}>
                                  {getAssetName(plan.assetId)} ({plan.assetPurchaseStatus})
                                </span>
                              )}
                              {plan.assetType === "Temporary" && (                              
                                <span data-testid={`plan-asset-${plan.id}`}>
                                  {plan.assetName || "Unknown"} (Temporary)
                                </span>
                              )}
                          </div>
                          {plan.assetPurchaseStatus === "New" && plan.payment && (
                            <div>
                              <span className="text-muted-foreground">Purchased Value: </span>
                              <span data-testid={`plan-purchased-value-${plan.id}`}>
                                ₹{parseFloat(plan.payment).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditPlan(plan, requirement.id)}
                        data-testid={`button-edit-plan-${plan.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlan({
                            ...plan,
                            requirementId: requirement.id
                          });
                        }}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {isEventCompleted && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Review</span>
                        </div>
                        {reviewingPlanId !== plan.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReviewingPlanId(plan.id);
                              setReviewNotes(prev => ({
                                ...prev,
                                [plan.id]: plan.reviewNotes || ''
                              }));
                            }}
                            data-testid={`button-edit-review-${plan.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {(plan.customerRating || plan.teamRating) ? 'Edit' : 'Add'} Review
                          </Button>
                        )}
                      </div>
                      
                      {reviewingPlanId === plan.id ? (
                        <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                          <StarRating
                            label="Customer"
                            rating={plan.customerRating}
                            onChange={(rating) => {
                              updatePlanReviewMutation.mutate({
                                planId: plan.id,
                                customerRating: rating,
                                teamRating: plan.teamRating,
                                reviewNotes: reviewNotes[plan.id] || plan.reviewNotes,
                              });
                            }}
                            disabled={updatePlanReviewMutation.isPending}
                          />
                          <StarRating
                            label="Team"
                            rating={plan.teamRating}
                            onChange={(rating) => {
                              updatePlanReviewMutation.mutate({
                                planId: plan.id,
                                customerRating: plan.customerRating,
                                teamRating: rating,
                                reviewNotes: reviewNotes[plan.id] || plan.reviewNotes,
                              });
                            }}
                            disabled={updatePlanReviewMutation.isPending}
                          />
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Notes:</span>
                            <Textarea
                              value={reviewNotes[plan.id] || ''}
                              onChange={(e) => setReviewNotes(prev => ({
                                ...prev,
                                [plan.id]: e.target.value
                              }))}
                              placeholder="Add notes for future reference..."
                              className="text-sm min-h-[60px]"
                              data-testid={`textarea-review-notes-${plan.id}`}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewingPlanId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                updatePlanReviewMutation.mutate({
                                  planId: plan.id,
                                  customerRating: plan.customerRating,
                                  teamRating: plan.teamRating,
                                  reviewNotes: reviewNotes[plan.id] || null,
                                });
                                setReviewingPlanId(null);
                              }}
                              disabled={updatePlanReviewMutation.isPending}
                              data-testid={`button-save-review-${plan.id}`}
                            >
                              Save Review
                            </Button>
                          </div>
                        </div>
                      ) : (plan.customerRating || plan.teamRating || plan.reviewNotes) ? (
                        <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-md">
                          {plan.customerRating && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground min-w-[80px]">Customer:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= plan.customerRating!
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {plan.teamRating && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground min-w-[80px]">Team:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= plan.teamRating!
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {plan.reviewNotes && (
                            <p className="text-xs text-muted-foreground italic">
                              "{plan.reviewNotes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No review yet</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
