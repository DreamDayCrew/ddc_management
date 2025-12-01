import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { AssetItem } from "@/components/asset-item";
import { AssetForm } from "@/components/forms/asset-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Assets() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });
  
  const { data: config } = useQuery<{ assetCategories: string[] }>({
    queryKey: ["/api/configuration"],
    select: (data) => ({
      assetCategories: data?.assetCategories || []
    })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
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

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || asset.category === categoryFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories and statuses from assets
  const categories = Array.from(new Set(assets.map(asset => asset.category))).filter(Boolean);
  const statuses = Array.from(new Set(assets.map(asset => asset.status))).filter(Boolean);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAsset(undefined);
    }
  };

  const handleFormSuccess = () => {
    handleDialogClose(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Assets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your assets
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-asset">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-assets"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(categoryFilter || statusFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setCategoryFilter("");
              setStatusFilter("");
            }}
            className="h-10"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading assets...</div>
      ) : (
        <div className="space-y-3">
          {filteredAssets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No assets found
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <AssetItem
                key={asset.id}
                {...asset}
                purchasedAmount={asset.purchasedAmount || "0"}
                onEdit={() => handleEdit(asset)}
                onDelete={() => handleDelete(asset.id)}
              />
            ))
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
          </DialogHeader>
          <AssetForm asset={editingAsset} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
