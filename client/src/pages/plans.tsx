import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  type FulfillmentPlan, 
  type Configuration,
  type TeamMember,
  type Vendor,
  type Asset,
  type Event,
  type Requirement
} from "@shared/schema";

export default function PlansPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: plans, isLoading: plansLoading } = useQuery<FulfillmentPlan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: allRequirements = [] } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Success",
        description: "Fulfillment plan deleted successfully",
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
    if (!id) return "Unknown";
    const member = teamMembers?.find((m) => m.id === id);
    return member?.name || "Unknown";
  };

  const getVendorName = (id: string | null) => {
    if (!id) return "Unknown";
    const vendor = vendors?.find((v) => v.id === id);
    return vendor?.name || "Unknown";
  };

  const getAssetName = (id: string | null) => {
    if (!id) return "Unknown";
    const asset = assets?.find((a) => a.id === id);
    return asset?.name || "Unknown";
  };

  const getEventName = (requirementId: string) => {
    const requirement = allRequirements.find((r) => r.id === requirementId);
    if (!requirement) return "Unknown Event";
    const event = events?.find((e) => e.id === requirement.eventId);
    return event?.eventName || "Unknown Event";
  };

  const filteredPlans = plans?.filter((plan) => {
    const matchesSearch = searchQuery === "" || 
      (plan.planType.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (plan.planType === "Team" && getTeamMemberName(plan.teamMemberId).toLowerCase().includes(searchQuery.toLowerCase())) ||
       (plan.planType === "Vendor" && getVendorName(plan.vendorId).toLowerCase().includes(searchQuery.toLowerCase())) ||
       (plan.planType === "Asset" && getAssetName(plan.assetId).toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesType = filterType === "all" || plan.planType === filterType;
    const matchesStatus = filterStatus === "all" || plan.planStatus === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="page-title">Fulfillment Plans</h1>
            <p className="text-sm text-muted-foreground">
              Manage all fulfillment plans across all events
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Team">Team</SelectItem>
              <SelectItem value="Vendor">Vendor</SelectItem>
              <SelectItem value="Asset">Asset</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {config?.planStatuses?.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {plansLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading plans...</div>
        ) : filteredPlans && filteredPlans.length > 0 ? (
          <div className="grid gap-3">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="p-4" data-testid={`plan-card-${plan.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" data-testid={`plan-type-${plan.id}`}>
                        {plan.planType}
                      </Badge>
                      <Badge className="bg-chart-1 text-white" data-testid={`plan-status-${plan.id}`}>
                        {plan.planStatus}
                      </Badge>
                    </div>

                    {plan.planType === "Team" && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Team: </span>
                          <span data-testid={`plan-team-${plan.id}`}>
                            {getTeamMemberName(plan.teamMemberId)} ({plan.teamRole})
                          </span>
                        </div>
                        {plan.payment && (
                          <div>
                            <span className="text-muted-foreground">Payment: </span>
                            <span data-testid={`plan-payment-${plan.id}`}>
                              ₹{parseFloat(plan.payment).toFixed(2)}
                            </span>
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
                            ₹{parseFloat(plan.vendorAmount || "0").toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment: </span>
                          <Badge variant="outline">
                            {plan.vendorPaymentStatus}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {plan.planType === "Asset" && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Asset: </span>
                          <span data-testid={`plan-asset-${plan.id}`}>
                            {getAssetName(plan.assetId)} ({plan.assetPurchaseStatus})
                          </span>
                        </div>
                        {plan.assetPurchaseStatus === "New" && plan.purchasedValue && (
                          <div>
                            <span className="text-muted-foreground">Purchased Value: </span>
                            <span data-testid={`plan-purchased-value-${plan.id}`}>
                              ₹{parseFloat(plan.purchasedValue).toFixed(2)}
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
                      onClick={() => deleteMutation.mutate(plan.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${plan.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No fulfillment plans found
          </div>
        )}
      </div>
    </div>
  );
}
