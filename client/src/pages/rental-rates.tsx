import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type AssetRentalRate, type Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Clock, IndianRupee } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface RentalRateFormData {
  assetId: string;
  duration: string;
  timeUnit: string;
  amount: string;
}

export default function RentalRates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<AssetRentalRate | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<AssetRentalRate | null>(null);
  const [formData, setFormData] = useState<RentalRateFormData>({
    assetId: "",
    duration: "",
    timeUnit: "hrs",
    amount: "",
  });

  const { data: rentalRates = [], isLoading } = useQuery<AssetRentalRate[]>({
    queryKey: ["/api/rental-rates"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: RentalRateFormData) => {
      await apiRequest("POST", "/api/rental-rates", {
        ...data,
        duration: parseInt(data.duration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-rates"] });
      toast({
        title: "Success",
        description: "Rental rate created successfully",
      });
      handleDialogClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RentalRateFormData> }) => {
      await apiRequest("PATCH", `/api/rental-rates/${id}`, {
        ...data,
        duration: data.duration ? parseInt(data.duration) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-rates"] });
      toast({
        title: "Success",
        description: "Rental rate updated successfully",
      });
      handleDialogClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rental-rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-rates"] });
      toast({
        title: "Success",
        description: "Rental rate deleted successfully",
      });
      setDeleteDialogOpen(false);
      setRateToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRate(undefined);
    setFormData({
      assetId: "",
      duration: "",
      timeUnit: "hrs",
      amount: "",
    });
  };

  const handleEdit = (rate: AssetRentalRate) => {
    setEditingRate(rate);
    setFormData({
      assetId: rate.assetId,
      duration: rate.duration.toString(),
      timeUnit: rate.timeUnit,
      amount: rate.amount || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (rate: AssetRentalRate) => {
    setRateToDelete(rate);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (rateToDelete) {
      deleteMutation.mutate(rateToDelete.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.duration || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || "Unknown Asset";
  };

  const getAssetCategory = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.category || "";
  };

  const filteredRates = useMemo(() => {
    return rentalRates.filter(rate => {
      const assetName = getAssetName(rate.assetId).toLowerCase();
      const matchesSearch = assetName.includes(searchQuery.toLowerCase()) ||
        rate.timeUnit.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAsset = assetFilter === "all" || rate.assetId === assetFilter;
      return matchesSearch && matchesAsset;
    });
  }, [rentalRates, searchQuery, assetFilter, assets]);

  const groupedRates = useMemo(() => {
    const groups: Record<string, AssetRentalRate[]> = {};
    filteredRates.forEach(rate => {
      if (!groups[rate.assetId]) {
        groups[rate.assetId] = [];
      }
      groups[rate.assetId].push(rate);
    });
    Object.keys(groups).forEach(assetId => {
      groups[assetId].sort((a, b) => a.duration - b.duration);
    });
    return groups;
  }, [filteredRates]);

  const activeAssets = assets.filter(a => a.status === "Active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rental-rates-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Rental Rates</h1>
          <p className="text-muted-foreground">Set pricing tiers for asset rentals</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-rate">
          <Plus className="h-4 w-4 mr-2" />
          Add Rate
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-asset-filter">
            <SelectValue placeholder="Filter by asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            {activeAssets.map(asset => (
              <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedRates).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IndianRupee className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rental rates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || assetFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by adding rental rates for your assets"}
            </p>
            {!searchQuery && assetFilter === "all" && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Rate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedRates).map(([assetId, rates]) => (
            <Card key={assetId} data-testid={`card-asset-${assetId}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{getAssetName(assetId)}</CardTitle>
                  <Badge variant="outline">{getAssetCategory(assetId)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rates.map(rate => (
                    <div
                      key={rate.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`rate-item-${rate.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {rate.duration} {rate.timeUnit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {formatIndianCurrency(Number(rate.amount))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rate)}
                          data-testid={`button-edit-${rate.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rate)}
                          data-testid={`button-delete-${rate.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Rental Rate" : "Add Rental Rate"}</DialogTitle>
            <DialogDescription>
              Set the rental price for a specific duration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assetId">Asset *</Label>
              <Select
                value={formData.assetId}
                onValueChange={(value) => setFormData({ ...formData, assetId: value })}
              >
                <SelectTrigger data-testid="select-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {activeAssets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="e.g., 4"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  data-testid="input-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeUnit">Time Unit *</Label>
                <Select
                  value={formData.timeUnit}
                  onValueChange={(value) => setFormData({ ...formData, timeUnit: value })}
                >
                  <SelectTrigger data-testid="select-time-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hrs">Hours</SelectItem>
                    <SelectItem value="day">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="e.g., 3000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                data-testid="input-amount"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingRate ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rental Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rental rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
