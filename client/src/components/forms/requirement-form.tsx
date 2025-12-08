import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertRequirementSchema, type Requirement, type InsertRequirement, type Configuration, type TeamMember, type Event } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequirementFormProps {
  requirement?: Requirement;
  eventId: string;
  onSuccess?: () => void;
  isEventCompleted?: boolean;
}

export function RequirementForm({ requirement, eventId, onSuccess, isEventCompleted = false }: RequirementFormProps) {
  const { toast } = useToast();
  const isEditing = !!requirement;
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [pendingDiscountChange, setPendingDiscountChange] = useState<boolean | null>(null);
  const [images, setImages] = useState<string[]>(requirement?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  // Fetch event data to check for existing event-level discount
  const { data: eventData } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const form = useForm<Omit<InsertRequirement, 'order'>>({
    resolver: zodResolver(insertRequirementSchema.omit({ order: true })),
    defaultValues: {
      eventId: eventId,
      requirement: "",
      description: "",
      requirementOwner: "",
      requirementStatus: "To Do",
      price: 0,
      quantity: 1,
      req_discount: "false",
      req_discount_amount: "0",
      ...(requirement ? {
        eventId: requirement.eventId,
        requirement: requirement.requirement || "",
        description: requirement.description || "",
        requirementOwner: requirement.requirementOwner || "",
        requirementStatus: requirement.requirementStatus || "To Do",
        price: requirement.price || 0,
        quantity: requirement.quantity || 1,
        req_discount: requirement.req_discount || "false",
        req_discount_amount: requirement.req_discount_amount || "0",
      } : {})
    },
  });

  // Watch price, quantity, and discount fields for local calculation
  const price = form.watch('price');
  const quantity = form.watch('quantity');
  const reqDiscount = form.watch('req_discount');
  const reqDiscountAmount = form.watch('req_discount_amount');
  
  // Debug log form values
  console.log('Form values:', {
    price,
    quantity,
    reqDiscount,
    reqDiscountAmount,
    priceType: typeof price,
    quantityType: typeof quantity
  });
  
  // Calculate order with discount applied
  const baseAmount = (Number(price) || 0) * (Number(quantity) || 1);
  const discountAmount = reqDiscount === 'true' ? (Number(reqDiscountAmount) || 0) : 0;
  const order = baseAmount - discountAmount;
  
  console.log('Calculated order:', {
    baseAmount,
    discountAmount,
    finalOrder: order
  });

  // Handler for requirement discount toggle
  const handleRequirementDiscountToggle = (checked: boolean) => {
    if (checked) {
      // Check if event has discount enabled
      if (eventData?.discount === 'true' && eventData?.discount_amount && parseFloat(eventData.discount_amount) > 0) {
        setPendingDiscountChange(checked);
        setShowDiscountAlert(true);
      } else {
        // No conflict, enable discount directly
        form.setValue('req_discount', 'true');
      }
    } else {
      // Disable discount without confirmation
      form.setValue('req_discount', 'false');
      form.setValue('req_discount_amount', '0');
    }
  };

  // Handler for discount alert confirmation
  const handleDiscountAlertConfirm = () => {
    if (pendingDiscountChange) {
      form.setValue('req_discount', 'true');
      // Note: In a real implementation, you might also need to remove discount from event
      // This would require additional API calls to update the event
    }
    setShowDiscountAlert(false);
    setPendingDiscountChange(null);
  };

  const handleDiscountAlertCancel = () => {
    setShowDiscountAlert(false);
    setPendingDiscountChange(null);
    // Keep the current discount state
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertRequirement) => {
      const res = await apiRequest("POST", "/api/requirements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
      form.reset();
      onSuccess?.();
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
    mutationFn: async (data: InsertRequirement) => {
      const res = await apiRequest("PATCH", `/api/requirements/${requirement?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Requirement updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !requirement?.id) return;

    const remainingSlots = 5 - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many images",
        description: `You can only upload ${remainingSlots} more image(s). Max 5 images allowed.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`/api/requirements/${requirement.id}/images`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload images');
      }

      setImages(result.images);
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Image delete handler
  const handleDeleteImage = async (imageUrl: string) => {
    if (!requirement?.id) return;

    try {
      const response = await apiRequest("DELETE", `/api/requirements/${requirement.id}/images`, { imageUrl });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image');
      }

      setImages(result.images);
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: Omit<InsertRequirement, 'order'>) => {
    // Calculate the order with discount applied before submission
    const baseAmount = (Number(data.price) || 0) * (Number(data.quantity) || 1);
    const discountAmount = data.req_discount === 'true' ? (Number(data.req_discount_amount) || 0) : 0;
    const order = baseAmount - discountAmount;
    
    console.log("Form data before processing:", data);
    
    // Create submission data with all required fields including discount fields
    const submissionData: InsertRequirement = {
      eventId: data.eventId,
      requirement: data.requirement,
      description: data.description || '',
      requirementOwner: data.requirementOwner || null,
      requirementStatus: data.requirementStatus,
      price: data.price,
      quantity: data.quantity,
      order,
      req_discount: data.req_discount || 'false',
      req_discount_amount: data.req_discount_amount || '0'
    };
    
    console.log("Submitting data to server:", submissionData);
    
    if (isEditing && requirement?.id) {
      console.log("Updating existing requirement with ID:", requirement.id);
      updateMutation.mutate(submissionData);
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <React.Fragment>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="requirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter requirement" data-testid="input-requirement" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter description (optional)"
                  className="min-h-[100px]"
                  data-testid="input-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirementOwner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Owner</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger data-testid="select-requirement-owner">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirementStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-requirement-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {config?.planStatuses?.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Requirement Discount Toggle */}
        <FormField
          control={form.control}
          name="req_discount"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Requirement Discount</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Apply discount for this requirement
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === 'true'}
                  onCheckedChange={(checked) => handleRequirementDiscountToggle(checked)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Discount Amount Field */}
        {form.watch('req_discount') === 'true' && (
          <FormField
            control={form.control}
            name="req_discount_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter discount amount"
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  The amount discounted for this requirement
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter price for single quantity"
                  data-testid="input-requirement-price"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter the quantity"
                  data-testid="input-requirement-quantity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Invoice Amount (Auto-calculated)</FormLabel>
          <FormControl>
            <Input
              type="number"
              readOnly
              className="bg-muted/50"
              value={order}
              data-testid="input-requirement-order"
            />
          </FormControl>
        </FormItem>

        {/* Image Upload Section - Only show when editing and event is completed */}
        {isEditing && isEventCompleted && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-base">Event Images</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Upload images for this requirement (max 5 images)
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {images.length}/5 images
              </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={imageUrl}
                      alt={`Requirement image ${index + 1}`}
                      className="w-full h-full object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imageUrl)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-image-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {images.length < 5 && (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-upload-images"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-images"
                >
                  {isUploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, WebP (max 5MB each)
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-requirement">
            {isPending ? "Saving..." : isEditing ? "Update Requirement" : "Create Requirement"}
          </Button>
        </div>
      </form>
    </Form>

    {/* Discount Conflict Alert Dialog */}
    <AlertDialog open={showDiscountAlert} onOpenChange={setShowDiscountAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discount Conflict</AlertDialogTitle>
          <AlertDialogDescription>
            Already discount is applied for the event. Enabling discount for this requirement might remove discount at event level. Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscountAlertCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDiscountAlertConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </React.Fragment>
  );
}
