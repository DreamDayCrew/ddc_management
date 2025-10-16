import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Vendor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Star } from "lucide-react";
import { VendorCard } from "@/components/vendor-card";
import { VendorForm } from "@/components/forms/vendor-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Vendors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });
  
  const { data: config } = useQuery<{ vendorCategories: string[] }>({
    queryKey: ["/api/configuration"],
    select: (data) => ({
      vendorCategories: data?.vendorCategories || []
    })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
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

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
    const matchesRating = !ratingFilter || 
      (vendor.rating !== null && vendor.rating.toString() === ratingFilter);
    return matchesSearch && matchesCategory && matchesRating;
  });

  // Get unique categories from vendors
  const categories = Array.from(new Set(vendors
    .map(vendor => vendor.category)
    .filter((category): category is string => Boolean(category))
  ));
  const ratings = [5, 4, 3, 2, 1];

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingVendor(undefined);
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
            Vendors
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage vendor relationships and ratings
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-vendor">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-vendors"
          />
        </div>
        
        <Select 
          value={categoryFilter} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={ratingFilter} 
          onValueChange={setRatingFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {ratings.map((rating) => (
              <SelectItem key={rating} value={rating.toString()}>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(categoryFilter !== "all" || ratingFilter !== "") && (
          <Button
            variant="outline"
            onClick={() => {
              setCategoryFilter("all");
              setRatingFilter("");
            }}
            className="h-10"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading vendors...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No vendors found
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                {...vendor}
                onEdit={() => handleEdit(vendor)}
              />
            ))
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </DialogHeader>
          <VendorForm vendor={editingVendor} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
