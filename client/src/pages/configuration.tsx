import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Configuration, type InsertConfiguration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Building2, Package, Briefcase, Users as UsersIcon, DollarSign, CheckCircle, Pencil, CreditCard, Tag } from "lucide-react";

const businessInfoSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  logo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  includeGst: z.string().optional(),
  website: z.string().optional(),
  termsAndConditions: z.string().optional(),
  signatureImage: z.string().optional(),
  upiId: z.string().optional(),
  upiQrCode: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
});

const arrayItemSchema = z.object({
  item: z.string().min(1, "Item is required"),
});

export default function Configuration() {
  const { toast } = useToast();
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);
  const [arrayDialogOpen, setArrayDialogOpen] = useState(false);
  const [arrayDialogConfig, setArrayDialogConfig] = useState<{
    title: string;
    field: keyof Configuration;
  } | null>(null);

  const { data: config, isLoading } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const businessForm = useForm<z.infer<typeof businessInfoSchema>>({
    resolver: zodResolver(businessInfoSchema),
    values: {
      businessName: config?.businessName || "",
      logo: config?.logo || "",
      phone: config?.phone || "",
      email: config?.email || "",
      address: config?.address || "",
      gstNumber: config?.gstNumber || "",
      panNumber: config?.panNumber || "",
      includeGst: config?.includeGst || "true",
      website: config?.website || "",
      termsAndConditions: config?.termsAndConditions || "",
      signatureImage: config?.signatureImage || "",
      upiId: config?.upiId || "",
      upiQrCode: config?.upiQrCode || "",
      accountHolderName: config?.accountHolderName || "",
      bankName: config?.bankName || "",
      accountNumber: config?.accountNumber || "",
      ifscCode: config?.ifscCode || "",
    },
  });

  const arrayForm = useForm<z.infer<typeof arrayItemSchema>>({
    resolver: zodResolver(arrayItemSchema),
    defaultValues: {
      item: "",
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<InsertConfiguration>) => {
      if (!config?.id) {
        const res = await apiRequest("POST", "/api/configuration", data);
        return res.json();
      }
      const res = await apiRequest("PATCH", `/api/configuration/${config.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({
        title: "Success",
        description: "Configuration updated successfully",
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

  const onBusinessInfoSubmit = (data: z.infer<typeof businessInfoSchema>) => {
    updateConfigMutation.mutate(data, {
      onSuccess: () => setBusinessInfoOpen(false),
    });
  };

  const onArrayItemAdd = (data: z.infer<typeof arrayItemSchema>) => {
    if (!arrayDialogConfig || !config) return;
    
    const currentArray = (config[arrayDialogConfig.field] as string[]) || [];
    
    if (currentArray.includes(data.item)) {
      toast({
        title: "Error",
        description: "Item already exists",
        variant: "destructive",
      });
      return;
    }

    updateConfigMutation.mutate(
      {
        [arrayDialogConfig.field]: [...currentArray, data.item],
      },
      {
        onSuccess: () => {
          arrayForm.reset();
          setArrayDialogOpen(false);
          setArrayDialogConfig(null);
        },
      }
    );
  };

  const openArrayDialog = (title: string, field: keyof Configuration) => {
    setArrayDialogConfig({ title, field });
    setArrayDialogOpen(true);
  };

  const ConfigSection = ({
    title,
    icon: Icon,
    items,
    field,
    addButtonId,
  }: {
    title: string;
    icon: React.ElementType;
    items: string[];
    field: keyof Configuration;
    addButtonId: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openArrayDialog(title, field)}
          data-testid={addButtonId}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items?.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="no-default-hover-elevate no-default-active-elevate"
            >
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">
          Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage system settings and dropdown options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config?.logo && (
            <div>
              <p className="text-sm font-medium">Logo</p>
              <img src={config.logo} alt="Business logo" className="h-16 w-16 object-contain rounded border mt-2" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Business Name</p>
            <p className="text-muted-foreground">{config?.businessName || "Not set"}</p>
          </div>
          {config?.phone && (
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-muted-foreground">{config.phone}</p>
            </div>
          )}
          {config?.email && (
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground">{config.email}</p>
            </div>
          )}
          {config?.address && (
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-muted-foreground">{config.address}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBusinessInfoOpen(true)}
            data-testid="button-edit-business-info"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Information
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ConfigSection
          title="Asset Categories"
          icon={Package}
          items={config?.assetCategories || []}
          field="assetCategories"
          addButtonId="button-add-asset-category"
        />
        <ConfigSection
          title="Services Provided"
          icon={Briefcase}
          items={config?.servicesProvided || []}
          field="servicesProvided"
          addButtonId="button-add-service"
        />
        <ConfigSection
          title="Plan Statuses"
          icon={CheckCircle}
          items={config?.planStatuses || []}
          field="planStatuses"
          addButtonId="button-add-plan-status"
        />
        <ConfigSection
          title="Team Roles"
          icon={UsersIcon}
          items={config?.roles || []}
          field="roles"
          addButtonId="button-add-role"
        />
        <ConfigSection
          title="Payment Modes"
          icon={DollarSign}
          items={config?.paymentModes || []}
          field="paymentModes"
          addButtonId="button-add-payment-mode"
        />
        <ConfigSection
          title="Payment Statuses"
          icon={CheckCircle}
          items={config?.paymentStatuses || []}
          field="paymentStatuses"
          addButtonId="button-add-payment-status"
        />
        <ConfigSection
          title="Vendor Categories"
          icon={Briefcase}
          items={config?.vendorCategories || []}
          field="vendorCategories"
          addButtonId="button-add-vendor-category"
        />
        <ConfigSection
          title="Expense Categories"
          icon={CreditCard}
          items={config?.expenseCategories || []}
          field="expenseCategories"
          addButtonId="button-add-expense-category"
        />
        <ConfigSection
          title="Package Tiers"
          icon={Tag}
          items={config?.packages || []}
          field="packages"
          addButtonId="button-add-package"
        />
      </div>

      <Dialog open={businessInfoOpen} onOpenChange={setBusinessInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
          </DialogHeader>
          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit(onBusinessInfoSubmit)} className="space-y-4">
              <FormField
                control={businessForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter business name" data-testid="input-business-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              field.onChange(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-business-logo"
                      />
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <img src={field.value} alt="Logo preview" className="h-20 w-20 object-contain rounded border" />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" data-testid="input-business-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email" data-testid="input-business-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter address" data-testid="input-business-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter GST number" data-testid="input-business-gst" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="panNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter PAN number" data-testid="input-business-pan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter website URL" data-testid="input-business-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter invoice terms and conditions" rows={4} data-testid="input-terms-conditions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="includeGst"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value === "true"} 
                        onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
                        data-testid="checkbox-include-gst"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include GST in Invoices</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        When enabled, GST calculation (18%) will be shown on invoices
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={businessForm.control}
                name="signatureImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signature Image (for Invoices)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              field.onChange(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-signature-image"
                      />
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <img src={field.value} alt="Signature preview" className="h-16 w-32 object-contain rounded border" />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Payment Information</h4>
                <div className="space-y-4">
                  <FormField
                    control={businessForm.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="yourname@upi" data-testid="input-upi-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="upiQrCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI QR Code</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  field.onChange(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            data-testid="input-upi-qr-code"
                          />
                        </FormControl>
                        {field.value && (
                          <div className="mt-2">
                            <img src={field.value} alt="UPI QR Code preview" className="h-24 w-24 object-contain rounded border" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter account holder name" data-testid="input-account-holder" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter bank name" data-testid="input-bank-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter account number" data-testid="input-account-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter IFSC code" data-testid="input-ifsc-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-save-business-info"
                >
                  {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={arrayDialogOpen} onOpenChange={setArrayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {arrayDialogConfig?.title}</DialogTitle>
          </DialogHeader>
          <Form {...arrayForm}>
            <form onSubmit={arrayForm.handleSubmit(onArrayItemAdd)} className="space-y-4">
              <FormField
                control={arrayForm.control}
                name="item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter item name" data-testid="input-array-item" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-add-array-item"
                >
                  {updateConfigMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
