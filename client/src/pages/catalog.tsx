import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type CatalogItem, type Configuration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getPackageColor(pkg: string): string {
  switch (pkg.toLowerCase()) {
    case 'ultra':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'premium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'budget':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

interface CatalogFormData {
  serviceType: string;
  package: string;
  itemName: string;
  description: string;
  price: string;
}

export default function Catalog() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [packageFilter, setPackageFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | undefined>();
  const [formData, setFormData] = useState<CatalogFormData>({
    serviceType: "",
    package: "",
    itemName: "",
    description: "",
    price: "",
  });

  const { data: catalogItems = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CatalogFormData) => {
      await apiRequest("POST", "/api/catalog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Catalog item created successfully",
      });
      handleDialogClose(false);
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CatalogFormData> }) => {
      await apiRequest("PATCH", `/api/catalog/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Catalog item updated successfully",
      });
      handleDialogClose(false);
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
      await apiRequest("DELETE", `/api/catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Catalog item deleted successfully",
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

  const services = config?.servicesProvided || [];
  const packages = config?.packages || ['Ultra', 'Premium', 'Budget'];

  const filteredItems = catalogItems.filter((item) => {
    const matchesSearch = 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesService = serviceFilter === "all" || !serviceFilter || item.serviceType === serviceFilter;
    const matchesPackage = packageFilter === "all" || !packageFilter || item.package === packageFilter;
    return matchesSearch && matchesService && matchesPackage;
  });

  const groupedByService = filteredItems.reduce((acc, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = {};
    }
    if (!acc[item.serviceType][item.package]) {
      acc[item.serviceType][item.package] = [];
    }
    acc[item.serviceType][item.package].push(item);
    return acc;
  }, {} as Record<string, Record<string, CatalogItem[]>>);

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      serviceType: item.serviceType,
      package: item.package,
      itemName: item.itemName,
      description: item.description || "",
      price: item.price || "0",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this catalog item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingItem(undefined);
      setFormData({
        serviceType: "",
        package: "",
        itemName: "",
        description: "",
        price: "",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setFormData({
      serviceType: "",
      package: "",
      itemName: "",
      description: "",
      price: "",
    });
    setDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your catalog...",
      });
      
      const response = await fetch('/api/catalog/pdf');
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Dream_Day_Crew_Service_Catalog.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Catalog PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF catalog",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Service Catalog
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your service packages and offerings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} data-testid="button-download-catalog">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleAddNew} data-testid="button-add-catalog-item">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-catalog"
          />
        </div>

        <Select value={serviceFilter || "all"} onValueChange={setServiceFilter}>
          <SelectTrigger data-testid="select-service-filter">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={packageFilter || "all"} onValueChange={setPackageFilter}>
          <SelectTrigger data-testid="select-package-filter">
            <SelectValue placeholder="Filter by package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            {packages.map((pkg) => (
              <SelectItem key={pkg} value={pkg}>
                {pkg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {((serviceFilter && serviceFilter !== "all") || (packageFilter && packageFilter !== "all")) && (
          <Button
            variant="outline"
            onClick={() => {
              setServiceFilter("all");
              setPackageFilter("all");
            }}
            data-testid="button-clear-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-muted-foreground">Package Legend:</span>
        {packages.map((pkg) => (
          <Badge key={pkg} className={`${getPackageColor(pkg)} no-default-hover-elevate no-default-active-elevate`}>
            {pkg}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading catalog...</div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No catalog items found</p>
            <Button className="mt-4" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="grouped" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grouped" data-testid="tab-grouped">By Service</TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grouped" className="space-y-6">
            {Object.entries(groupedByService).map(([service, packageItems]) => (
              <Card key={service}>
                <CardHeader>
                  <CardTitle className="text-lg">{service}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {packages.map((pkg) => {
                      const items = packageItems[pkg] || [];
                      return (
                        <div key={pkg} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getPackageColor(pkg)} no-default-hover-elevate no-default-active-elevate`}>
                              {pkg}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ({items.length} items)
                            </span>
                          </div>
                          <div className="space-y-2">
                            {items.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">No items</p>
                            ) : (
                              items.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 border rounded-md space-y-2 hover-elevate"
                                  data-testid={`catalog-item-${item.id}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{item.itemName}</p>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEdit(item)}
                                        data-testid={`button-edit-${item.id}`}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete(item.id)}
                                        data-testid={`button-delete-${item.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm font-semibold text-[#800020] dark:text-[#ff6b8a]">
                                    {formatIndianCurrency(parseFloat(item.price || '0'))}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="list" className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover-elevate" data-testid={`catalog-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{item.itemName}</h3>
                        <Badge className={`${getPackageColor(item.package)} no-default-hover-elevate no-default-active-elevate`}>
                          {item.package}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.serviceType}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-[#800020] dark:text-[#ff6b8a]">
                        {formatIndianCurrency(parseFloat(item.price || '0'))}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update the details for this catalog item" 
                : "Add a new item to your service catalog"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select 
                value={formData.serviceType} 
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger data-testid="select-service-type">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">Package</Label>
              <Select 
                value={formData.package} 
                onValueChange={(value) => setFormData({ ...formData, package: value })}
              >
                <SelectTrigger data-testid="select-package">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="Enter item name"
                required
                data-testid="input-item-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                rows={3}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price"
                required
                data-testid="input-price"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {(createMutation.isPending || updateMutation.isPending) 
                  ? "Saving..." 
                  : editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
