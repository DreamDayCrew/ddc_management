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
import { format } from "date-fns";
import { z } from "zod";
import { useEffect } from "react";

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
}

const eventFormSchema = insertEventSchema.extend({
  finalizedQuote: z.string().optional(),
  ddcCost: z.string().optional(),
  initialQuote: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function EventForm({ event, onSuccess }: EventFormProps) {
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
      initialQuote: event?.initialQuote || "",
      finalizedQuote: event?.finalizedQuote || "",
      ddcCost: event?.ddcCost || "",
      paymentMode: event?.paymentMode || "",
      paymentStatus: event?.paymentStatus || "Pending",
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
    // Transform empty strings to undefined for decimal fields
    const transformedData = {
      ...data,
      initialQuote: data.initialQuote === "" ? undefined : data.initialQuote,
      finalizedQuote: data.finalizedQuote === "" ? undefined : data.finalizedQuote,
      ddcCost: data.ddcCost === "" ? undefined : data.ddcCost,
      profitLoss: data.profitLoss === "" ? undefined : data.profitLoss,
    } as InsertEvent;

    if (isEditing) {
      updateMutation.mutate(transformedData);
    } else {
      createMutation.mutate(transformedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
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
                <FormLabel>Client Phone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Enter client phone" data-testid="input-client-phone" />
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
                <FormLabel>Client Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Enter client address" data-testid="input-client-address" />
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
                <FormLabel>Client Email</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="email" placeholder="Enter client email" data-testid="input-client-email" />
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

          <FormField
            control={form.control}
            name="initialQuote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Quote</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="Enter initial quote" data-testid="input-initial-quote" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finalizedQuote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finalized Quote</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="Enter finalized quote" data-testid="input-finalized-quote" />
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
                <FormLabel>DDC Cost</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="Enter DDC cost" data-testid="input-ddc-cost" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
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
                <FormLabel>Payment Status</FormLabel>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-event">
            {isPending ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
