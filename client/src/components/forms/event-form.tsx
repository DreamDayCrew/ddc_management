import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertEventSchema, type Event, type InsertEvent, type Configuration, type Requirement } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface EventFormProps {
  event?: Event;
  invoiceAmount?: number;
  onSuccess?: () => void;
}

const eventFormSchema = z.object({
  providedService: z.string(),
  eventName: z.string(),
  eventDate: z.string(),
  venue: z.string(),
  source: z.string().optional(),
  clientName: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientAddress: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
  eventStatus: z.string().optional(),
  paymentMode: z.string().nullable().optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().nullable().optional(),
  registeredOn: z.string(),
  finalizedQuote: z.string().optional(),
  ddcCost: z.string().optional(),
  initialQuote: z.string().optional(),
  discount: z.string().optional(),
  discountAmount: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function EventForm({ event, invoiceAmount , onSuccess }: EventFormProps) {
  const { toast } = useToast();
  const isEditing = !!event;
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [pendingDiscountChange, setPendingDiscountChange] = useState<boolean | null>(null);

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  // Fetch requirements for this event to check for existing discounts
  const { data: requirements = [] } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements", event?.id],
    enabled: !!event?.id,
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      providedService: event?.providedService || "",
      eventName: event?.eventName || "",
      registeredOn: event?.registeredOn || format(new Date(), "yyyy-MM-dd"),
      eventDate: event?.eventDate || "",
      venue: event?.venue || "",
      clientName: event?.clientName || "",
      clientPhone: event?.clientPhone || "",
      clientAddress: event?.clientAddress || "",
      clientEmail: event?.clientEmail || "",
      eventStatus: event?.eventStatus || "Inquired",
      source: event?.source || "",
      paymentMode: event?.paymentMode || "",
      paymentStatus: event?.paymentStatus || "Pending",
      finalizedQuote: invoiceAmount?.toString() || "",
      discount: event?.discount || "false",
      discountAmount: event?.discount_amount || "0",
    },
  });

  const finalizedQuote = form.watch("finalizedQuote");
  const ddcCost = form.watch("ddcCost");

  // Note: profitLoss calculation removed as it's not in the form schema

  // Handler for event discount toggle
  const handleEventDiscountToggle = (checked: boolean) => {
    if (checked) {
      // Check if any requirements have discounts
      const requirementsWithDiscount = requirements.filter(req => 
        req.req_discount === 'true' && req.req_discount_amount && parseFloat(req.req_discount_amount) > 0
      );
      
      if (requirementsWithDiscount.length > 0) {
        setPendingDiscountChange(checked);
        setShowDiscountAlert(true);
      } else {
        // No conflict, enable discount directly
        form.setValue('discount', 'true');
      }
    } else {
      // Disable discount without confirmation
      form.setValue('discount', 'false');
      form.setValue('discountAmount', '0');
    }
  };

  // Handler for discount alert confirmation
  const handleDiscountAlertConfirm = () => {
    if (pendingDiscountChange) {
      form.setValue('discount', 'true');
      // Note: In a real implementation, you might also need to remove discounts from requirements
      // This would require additional API calls to update the requirements
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
    mutationFn: async (data: InsertEvent) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
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
    mutationFn: async (data: InsertEvent) => {
      const res = await apiRequest("PATCH", `/api/events/${event?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id] });
      toast({
        title: "Success",
        description: "Event updated successfully",
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

  const onSubmit = (data: EventFormData) => {
    // Map discount fields to match backend schema
    const submitData = {
      ...data,
      discount: data.discount || 'false',
      discount_amount: data.discountAmount || '0',
    };
    
    if (isEditing) {
      updateMutation.mutate(submitData as InsertEvent);
    } else {
      createMutation.mutate(submitData as InsertEvent);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Fragment>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="multiple" defaultValue={['basic-info', 'client-info', 'payment-info']} className="space-y-4">
          {/* Basic Information Section */}
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <AccordionItem value="basic-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium">Basic Information</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="providedService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provided Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-provided-service">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {config?.servicesProvided?.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
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
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter event name" data-testid="input-event-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registeredOn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registered On</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date" 
                            value={field.value || ''} 
                            data-testid="input-registered-on" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-event-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter venue" data-testid="input-venue" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="Enter source (e.g., Instagram, Referral, etc.)" 
                            data-testid="input-source" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Inquired">Inquired</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Event Discount Toggle and Amount in same row */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Event Discount</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value === 'true'}
                                onCheckedChange={(checked) => handleEventDiscountToggle(checked)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discountAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Amount</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter discount amount"
                                disabled={form.watch('discount') !== 'true'}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      The amount discounted from the invoice price
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Client Information Section */}
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <AccordionItem value="client-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium">Client Information</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Enter client name" data-testid="input-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Enter client phone" data-testid="input-client-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" placeholder="Enter client email" data-testid="input-client-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Enter client address" data-testid="input-client-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Payment Information Section */}
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <AccordionItem value="payment-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium">Payment Information</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {isEditing && (
                    <>
                      <FormField
                        control={form.control}
                        name="finalizedQuote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Value</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || 0 } readOnly type="number" placeholder="Enter finalized quote" data-testid="input-finalized-quote" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ddcCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DDC Spent</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} readOnly type="number" placeholder="Enter DDC cost" data-testid="input-ddc-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode of Transaction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-mode">
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {config?.paymentModes?.map((mode) => (
                              <SelectItem key={mode} value={mode}>
                                {mode}
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
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-status">
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {config?.paymentStatuses?.map((status) => (
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>
        </Accordion>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-event">
            {isPending ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
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
            Already discount is applied for {requirements.filter(req => req.req_discount === 'true' && req.req_discount_amount && parseFloat(req.req_discount_amount) > 0).length} requirement(s). 
            Enabling discount for the event might remove discount at requirement level. Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscountAlertCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDiscountAlertConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </Fragment>
  );
}