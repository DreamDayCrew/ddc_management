import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type Requirement,
  type FulfillmentPlan,
  type TeamMember,
  type Vendor,
  type Asset,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Edit, Plus, Trash2 } from "lucide-react";

interface RequirementItemProps {
  requirement: Requirement;
  eventId: string;
  teamMembers: TeamMember[];
  vendors: Vendor[];
  assets: Asset[];
  onDelete: (requirement: Requirement) => void;
  onEditPlan: (plan: FulfillmentPlan, requirementId: string) => void;
  onDeletePlan: (plan: FulfillmentPlan) => void;
}

export function RequirementItem({
  requirement,
  eventId,
  teamMembers,
  vendors,
  assets,
  onDelete,
  onEditPlan,
  onDeletePlan,
}: RequirementItemProps) {
  const [editRequirement, setEditRequirement] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);

  const { data: plans = [] } = useQuery<FulfillmentPlan[]>({
    queryKey: ["/api/requirements", requirement.id, "plans"],
  });

  const getTeamMemberName = (id: string | null) => {
    if (!id) return "Unknown";
    const member = teamMembers.find((m) => m.id === id);
    return member?.name || "Unknown";
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
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              #{requirement.order}
            </Badge>
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
                        onClick={() => onDeletePlan(plan)}
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
}
