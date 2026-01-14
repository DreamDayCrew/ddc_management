import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type Rental, type Asset, type RentalItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Trash2, Calendar, User, Phone, FileText, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
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

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'quote':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'invoice':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'returned':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'partial':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export default function Rentals() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);

  const { data: rentals = [], isLoading } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rentals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({
        title: "Success",
        description: "Rental deleted successfully",
      });
      setDeleteDialogOpen(false);
      setRentalToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (rental: Rental, e: React.MouseEvent) => {
    e.stopPropagation();
    setRentalToDelete(rental);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (rentalToDelete) {
      deleteMutation.mutate(rentalToDelete.id);
    }
  };

  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const matchesSearch = 
        rental.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || rental.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rentals, searchQuery, statusFilter]);

  const handleDownloadPdf = async (rental: Rental, type: 'quote' | 'invoice', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/rentals/${rental.id}/pdf?type=${type}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-${type}-${rental.id.slice(0, 8)}.pdf`;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rentals-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Rental Orders</h1>
          <p className="text-muted-foreground">Manage customer rental quotes and invoices</p>
        </div>
        <Button onClick={() => navigate("/rentals/new")} data-testid="button-add-rental">
          <Plus className="h-4 w-4 mr-2" />
          New Rental
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Quote">Quote</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rentals found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by creating a new rental order"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => navigate("/rentals/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Rental
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rental Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((rental) => (
                  <TableRow
                    key={rental.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/rentals/${rental.id}`)}
                    data-testid={`row-rental-${rental.id}`}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{rental.customerName}</span>
                        {rental.customerPhone && (
                          <span className="text-sm text-muted-foreground">{rental.customerPhone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(rental.rentalDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {rental.returnDate ? format(new Date(rental.returnDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(rental.status)}>{rental.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(rental.paymentStatus)}>{rental.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatIndianCurrency(Number(rental.totalAmount || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDownloadPdf(rental, rental.status === 'Quote' ? 'quote' : 'invoice', e)}
                          title={rental.status === 'Quote' ? 'Download Quote' : 'Download Invoice'}
                          data-testid={`button-download-${rental.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rentals/${rental.id}`);
                          }}
                          data-testid={`button-view-${rental.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(rental, e)}
                          data-testid={`button-delete-${rental.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rental</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rental for "{rentalToDelete?.customerName}"? 
              This will also delete all associated rental items. This action cannot be undone.
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
