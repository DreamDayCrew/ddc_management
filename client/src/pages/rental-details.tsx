import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { type Rental, type RentalItem, type Asset, type AssetRentalRate, type Configuration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Download, Clock, IndianRupee } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface RentalItemFormData {
  id?: string;
  assetId: string;
  quantity: number;
  duration: number;
  timeUnit: string;
  ratePerUnit: string;
  totalAmount: string;
  calculatePerQuantity: boolean;
}

export default function RentalDetails() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const rentalId = isNew ? undefined : params.id;

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    rentalDate: format(new Date(), "yyyy-MM-dd"),
    returnDate: "",
    status: "Quote",
    paymentStatus: "Pending",
    paymentMode: "",
    notes: "",
    discount: "false",
    discountAmount: "0",
  });

  const [items, setItems] = useState<RentalItemFormData[]>([]);
  const [newItem, setNewItem] = useState<RentalItemFormData>({
    assetId: "",
    quantity: 1,
    duration: 1,
    timeUnit: "hrs",
    ratePerUnit: "0",
    totalAmount: "0",
    calculatePerQuantity: true,
  });

  const [showAddRateDialog, setShowAddRateDialog] = useState(false);
  const [newRateForm, setNewRateForm] = useState({
    duration: 1,
    timeUnit: "hrs",
    amount: "",
  });

  const { data: rental, isLoading: rentalLoading } = useQuery<Rental>({
    queryKey: ["/api/rentals", rentalId],
    enabled: !!rentalId,
  });

  const { data: rentalItems = [], isLoading: itemsLoading } = useQuery<RentalItem[]>({
    queryKey: ["/api/rentals", rentalId, "items"],
    queryFn: async () => {
      if (!rentalId) return [];
      const response = await fetch(`/api/rentals/${rentalId}/items`);
      if (!response.ok) throw new Error("Failed to fetch rental items");
      return response.json();
    },
    enabled: !!rentalId,
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: rentalRates = [] } = useQuery<AssetRentalRate[]>({
    queryKey: ["/api/rental-rates"],
  });

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  useEffect(() => {
    if (rental) {
      setFormData({
        customerName: rental.customerName || "",
        customerPhone: rental.customerPhone || "",
        customerEmail: rental.customerEmail || "",
        customerAddress: rental.customerAddress || "",
        rentalDate: rental.rentalDate || format(new Date(), "yyyy-MM-dd"),
        returnDate: rental.returnDate || "",
        status: rental.status || "Quote",
        paymentStatus: rental.paymentStatus || "Pending",
        paymentMode: rental.paymentMode || "",
        notes: rental.notes || "",
        discount: rental.discount || "false",
        discountAmount: rental.discountAmount || "0",
      });
    }
  }, [rental]);

  useEffect(() => {
    if (rentalItems.length > 0) {
      setItems(rentalItems.map(item => ({
        id: item.id,
        assetId: item.assetId,
        quantity: item.quantity,
        duration: item.duration,
        timeUnit: item.timeUnit,
        ratePerUnit: item.ratePerUnit || "0",
        totalAmount: item.totalAmount || "0",
        calculatePerQuantity: true,
      })));
    }
  }, [rentalItems]);

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/rentals", data);
      return response.json();
    },
    onSuccess: async (newRental) => {
      for (const item of items) {
        const { calculatePerQuantity: _, ...itemData } = item;
        await apiRequest("POST", "/api/rental-items", {
          rentalId: newRental.id,
          ...itemData,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({
        title: "Success",
        description: "Rental created successfully",
      });
      navigate(`/rentals/${newRental.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/rentals/${rentalId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", rentalId] });
      toast({
        title: "Success",
        description: "Rental updated successfully",
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

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/rental-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", rentalId, "items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rental-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", rentalId, "items"] });
      toast({
        title: "Success",
        description: "Item removed",
      });
    },
  });

  const activeAssets = assets.filter(a => a.status === "Active");

  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || "Unknown Asset";
  };

  const getRatesForAsset = (assetId: string) => {
    return rentalRates.filter(r => r.assetId === assetId);
  };

  const calculateItemTotal = (quantity: number, rate: string, calculatePerQuantity: boolean) => {
    if (calculatePerQuantity) {
      return (quantity * Number(rate)).toString();
    }
    return rate;
  };

  const getAssetQuantity = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.quantity || 1;
  };

  const handleAssetSelect = (assetId: string) => {
    const rates = getRatesForAsset(assetId);
    if (rates.length > 0) {
      const firstRate = rates[0];
      const total = calculateItemTotal(1, firstRate.amount, true);
      setNewItem({
        assetId,
        quantity: 1,
        duration: firstRate.duration,
        timeUnit: firstRate.timeUnit,
        ratePerUnit: firstRate.amount,
        totalAmount: total,
        calculatePerQuantity: true,
      });
    } else {
      setNewItem({
        ...newItem,
        assetId,
        ratePerUnit: "0",
        totalAmount: "0",
      });
    }
  };

  const handleRateSelect = (rateId: string) => {
    if (rateId === "add-new-rate") {
      setShowAddRateDialog(true);
      return;
    }
    const rate = rentalRates.find(r => r.id === rateId);
    if (rate) {
      const total = calculateItemTotal(newItem.quantity, rate.amount, newItem.calculatePerQuantity);
      setNewItem({
        ...newItem,
        duration: rate.duration,
        timeUnit: rate.timeUnit,
        ratePerUnit: rate.amount,
        totalAmount: total,
      });
    }
  };

  const handleQuantityChange = (quantity: number) => {
    const maxQty = getAssetQuantity(newItem.assetId);
    const validQty = Math.min(Math.max(1, quantity), maxQty);
    const total = calculateItemTotal(validQty, newItem.ratePerUnit, newItem.calculatePerQuantity);
    setNewItem({
      ...newItem,
      quantity: validQty,
      totalAmount: total,
    });
  };

  const handleCalculatePerQuantityChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    const total = calculateItemTotal(newItem.quantity, newItem.ratePerUnit, isChecked);
    setNewItem({
      ...newItem,
      calculatePerQuantity: isChecked,
      totalAmount: total,
    });
  };

  const createRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/rental-rates", data);
      return response.json();
    },
    onSuccess: async (newRate) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/rental-rates"] });
      const total = calculateItemTotal(newItem.quantity, newRate.amount, newItem.calculatePerQuantity);
      setNewItem({
        ...newItem,
        duration: newRate.duration,
        timeUnit: newRate.timeUnit,
        ratePerUnit: newRate.amount,
        totalAmount: total,
      });
      setShowAddRateDialog(false);
      setNewRateForm({ duration: 1, timeUnit: "hrs", amount: "" });
      toast({
        title: "Success",
        description: "Rental rate added successfully",
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

  const existingRatesForAsset = useMemo(() => {
    return getRatesForAsset(newItem.assetId);
  }, [newItem.assetId, rentalRates]);

  const isDuplicateRate = useMemo(() => {
    return existingRatesForAsset.some(
      r => r.duration === newRateForm.duration && r.timeUnit === newRateForm.timeUnit
    );
  }, [existingRatesForAsset, newRateForm.duration, newRateForm.timeUnit]);

  const rateAmountWarning = useMemo(() => {
    if (!newRateForm.amount || Number(newRateForm.amount) <= 0) return null;
    const currentAmount = Number(newRateForm.amount);
    const currentDuration = newRateForm.duration;
    const currentUnit = newRateForm.timeUnit;
    
    const lowerDurationRates = existingRatesForAsset.filter(r => {
      if (r.timeUnit === currentUnit) {
        return r.duration < currentDuration;
      }
      if (currentUnit === "day" && r.timeUnit === "hrs") {
        return true;
      }
      return false;
    });

    for (const rate of lowerDurationRates) {
      const rateAmount = Number(rate.amount);
      if (currentAmount <= rateAmount) {
        return `You already have ${rate.duration} ${rate.timeUnit} configured at Rs.${rateAmount}. Consider setting a higher amount for ${currentDuration} ${currentUnit}.`;
      }
    }
    return null;
  }, [existingRatesForAsset, newRateForm.amount, newRateForm.duration, newRateForm.timeUnit]);

  const handleAddRate = () => {
    if (!newItem.assetId) {
      toast({
        title: "Error",
        description: "Please select an asset first",
        variant: "destructive",
      });
      return;
    }
    if (!newRateForm.amount || Number(newRateForm.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (isDuplicateRate) {
      toast({
        title: "Error",
        description: `A rate for ${newRateForm.duration} ${newRateForm.timeUnit} already exists for this asset`,
        variant: "destructive",
      });
      return;
    }
    createRateMutation.mutate({
      assetId: newItem.assetId,
      duration: newRateForm.duration,
      timeUnit: newRateForm.timeUnit,
      amount: newRateForm.amount,
    });
  };

  const addItem = async () => {
    if (!newItem.assetId) {
      toast({
        title: "Error",
        description: "Please select an asset",
        variant: "destructive",
      });
      return;
    }

    if (isNew) {
      setItems([...items, { ...newItem }]);
    } else {
      const { calculatePerQuantity: _, ...itemData } = newItem;
      await createItemMutation.mutateAsync({
        rentalId,
        ...itemData,
      });
    }

    setNewItem({
      assetId: "",
      quantity: 1,
      duration: 1,
      timeUnit: "hrs",
      ratePerUnit: "0",
      totalAmount: "0",
      calculatePerQuantity: true,
    });
  };

  const removeItem = async (index: number) => {
    if (isNew) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      const item = items[index];
      if (item.id) {
        await deleteItemMutation.mutateAsync(item.id);
        setItems(items.filter((_, i) => i !== index));
      }
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  }, [items]);

  const discountValue = formData.discount === "true" ? Number(formData.discountAmount || 0) : 0;
  const total = subtotal - discountValue;

  const handleSave = () => {
    if (!formData.customerName) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      totalAmount: total.toString(),
    };

    if (isNew) {
      createRentalMutation.mutate(data);
    } else {
      updateRentalMutation.mutate(data);
    }
  };

  const handleDownloadPdf = async (type: 'quote' | 'invoice') => {
    if (!rentalId) return;
    try {
      const response = await fetch(`/api/rentals/${rentalId}/pdf?type=${type}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-${type}-${rentalId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  if ((rentalLoading || itemsLoading) && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rental-details-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/rentals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {isNew ? "New Rental" : "Edit Rental"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new rental order" : `Editing rental for ${rental?.customerName}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <>
              <Button variant="outline" onClick={() => handleDownloadPdf('quote')}>
                <Download className="h-4 w-4 mr-2" />
                Quote
              </Button>
              <Button variant="outline" onClick={() => handleDownloadPdf('invoice')}>
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </>
          )}
          <Button
            onClick={handleSave}
            disabled={createRentalMutation.isPending || updateRentalMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {createRentalMutation.isPending || updateRentalMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    data-testid="input-customer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="Enter phone number"
                    data-testid="input-customer-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="Enter email address"
                    data-testid="input-customer-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    placeholder="Enter address"
                    data-testid="input-customer-address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rental Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="rentalDate">Rental Date *</Label>
                  <Input
                    id="rentalDate"
                    type="date"
                    value={formData.rentalDate}
                    onChange={(e) => setFormData({ ...formData, rentalDate: e.target.value })}
                    data-testid="input-rental-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    min={formData.rentalDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    data-testid="input-return-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quote">Quote</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger data-testid="select-payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rental Items</CardTitle>
              <CardDescription>Add assets to this rental</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 p-4 bg-muted/50 rounded-lg sm:grid-cols-6">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Asset</Label>
                  <Select value={newItem.assetId} onValueChange={handleAssetSelect}>
                    <SelectTrigger data-testid="select-new-asset">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Select
                    value={rentalRates.find(r => 
                      r.assetId === newItem.assetId && 
                      r.duration === newItem.duration && 
                      r.timeUnit === newItem.timeUnit
                    )?.id || ""}
                    onValueChange={handleRateSelect}
                    disabled={!newItem.assetId}
                  >
                    <SelectTrigger data-testid="select-new-rate">
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {getRatesForAsset(newItem.assetId).map(rate => (
                        <SelectItem key={rate.id} value={rate.id}>
                          {rate.duration} {rate.timeUnit} - {formatIndianCurrency(Number(rate.amount))}
                        </SelectItem>
                      ))}
                      <SelectItem value="add-new-rate" className="text-primary font-medium">
                        <Plus className="h-3 w-3 inline mr-1" />
                        Add Rental Rate
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qty (max: {getAssetQuantity(newItem.assetId)})</Label>
                  <Input
                    type="number"
                    min="1"
                    max={getAssetQuantity(newItem.assetId)}
                    value={newItem.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    data-testid="input-new-quantity"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="calculatePerQuantity"
                    checked={newItem.calculatePerQuantity}
                    onCheckedChange={handleCalculatePerQuantityChange}
                    data-testid="checkbox-per-quantity"
                  />
                  <Label htmlFor="calculatePerQuantity" className="text-xs">Per Qty</Label>
                </div>
                <div className="flex items-end">
                  <Button onClick={addItem} className="w-full" data-testid="button-add-item">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id || index} data-testid={`item-row-${index}`}>
                        <TableCell className="font-medium">{getAssetName(item.assetId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.duration} {item.timeUnit}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatIndianCurrency(Number(item.ratePerUnit))}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatIndianCurrency(Number(item.totalAmount))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Select an asset above to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatIndianCurrency(subtotal)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="discount"
                    checked={formData.discount === "true"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      discount: e.target.checked ? "true" : "false",
                      discountAmount: e.target.checked ? formData.discountAmount : "0"
                    })}
                    className="h-4 w-4"
                    data-testid="checkbox-discount"
                  />
                  <Label htmlFor="discount">Apply Discount</Label>
                </div>
                {formData.discount === "true" && (
                  <Input
                    type="number"
                    min="0"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    placeholder="Discount amount"
                    data-testid="input-discount-amount"
                  />
                )}
              </div>

              {formData.discount === "true" && discountValue > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-{formatIndianCurrency(discountValue)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatIndianCurrency(total)}</span>
              </div>

              <div className="pt-4 space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                >
                  <SelectTrigger data-testid="select-payment-mode">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {config?.paymentModes?.map(mode => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    )) || (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isNew && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadPdf('quote')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Quote PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadPdf('invoice')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice PDF
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAddRateDialog} onOpenChange={setShowAddRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rental Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Adding rate for: <strong>{getAssetName(newItem.assetId)}</strong>
            </p>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  type="number"
                  min="1"
                  value={newRateForm.duration}
                  onChange={(e) => setNewRateForm({ ...newRateForm, duration: parseInt(e.target.value) || 1 })}
                  data-testid="input-new-rate-duration"
                />
              </div>
              <div className="space-y-2">
                <Label>Time Unit</Label>
                <Select
                  value={newRateForm.timeUnit}
                  onValueChange={(value) => setNewRateForm({ ...newRateForm, timeUnit: value })}
                >
                  <SelectTrigger data-testid="select-new-rate-time-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hrs">Hours</SelectItem>
                    <SelectItem value="day">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isDuplicateRate && (
              <p className="text-sm text-destructive">
                A rate for {newRateForm.duration} {newRateForm.timeUnit} already exists for this asset.
              </p>
            )}
            <div className="space-y-2">
              <Label>Amount (Rs.)</Label>
              <Input
                type="number"
                min="0"
                value={newRateForm.amount}
                onChange={(e) => setNewRateForm({ ...newRateForm, amount: e.target.value })}
                placeholder="Enter amount"
                data-testid="input-new-rate-amount"
              />
              {rateAmountWarning && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {rateAmountWarning}
                </p>
              )}
            </div>
            {existingRatesForAsset.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p className="font-medium mb-1">Existing rates for this asset:</p>
                {existingRatesForAsset.map(rate => (
                  <span key={rate.id} className="inline-block mr-2">
                    {rate.duration} {rate.timeUnit} - Rs.{rate.amount}
                  </span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRate}
              disabled={createRateMutation.isPending || isDuplicateRate}
              data-testid="button-save-rate"
            >
              {createRateMutation.isPending ? "Saving..." : "Save Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
