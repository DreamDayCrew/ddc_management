import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertEventSchema, type Event, type InsertEvent, type Configuration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

interface EventFormProps {
  event?: Event;
  invoiceAmount?: number;
  onSuccess?: () => void;
}

const eventFormSchema = insertEventSchema.extend({
  finalizedQuote: z.string().optional(),
  ddcCost: z.string().optional(),
  initialQuote: z.string().optional(),
  source: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function EventForm({ event, invoiceAmount , onSuccess }: EventFormProps) {
  const { toast } = useToast();
  const isEditing = !!event;

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
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
    },
  });

  const finalizedQuote = form.watch("finalizedQuote");
  const ddcCost = form.watch("ddcCost");

  useEffect(() => {
    const finalized = parseFloat(finalizedQuote as string) || 0;
    const ddc = parseFloat(ddcCost as string) || 0;
    const profitLoss = finalized - ddc;
    
    form.setValue("profitLoss", profitLoss.toString());
  }, [finalizedQuote, ddcCost, form]);

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
    if (isEditing) {
      updateMutation.mutate(data as InsertEvent);
    } else {
      createMutation.mutate(data as InsertEvent);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
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
                          <Input {...field} type="date" data-testid="input-registered-on" />
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
  );
}