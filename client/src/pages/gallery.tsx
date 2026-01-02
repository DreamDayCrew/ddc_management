import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Calendar, Image as ImageIcon, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface GalleryRequirement {
  id: string;
  requirement: string;
  description: string | null;
  images: string[];
}

interface GalleryEvent {
  eventId: string;
  eventName: string;
  clientName: string;
  eventDate: string;
  status: string;
  requirements: GalleryRequirement[];
  totalImages: number;
}

export default function GalleryPage() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ requirementId: string; imageUrl: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: gallery = [], isLoading } = useQuery<GalleryEvent[]>({
    queryKey: ["/api/gallery"],
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ requirementId, imageUrl }: { requirementId: string; imageUrl: string }) => {
      return apiRequest("DELETE", `/api/requirements/${requirementId}/images`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Image deleted",
        description: "The image has been removed successfully.",
      });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
    } else {
      setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
    }
  };

  const totalImages = gallery.reduce((sum, event) => sum + event.totalImages, 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">DDC Gallery</h1>
          <p className="text-muted-foreground">
            {totalImages} image{totalImages !== 1 ? "s" : ""} across {gallery.length} event{gallery.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {gallery.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No images yet</h3>
            <p className="text-muted-foreground text-center mt-2">
              Images uploaded to event requirements will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {gallery.map((event) => (
            <AccordionItem
              key={event.eventId}
              value={event.eventId}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid={`accordion-event-${event.eventId}`}>
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex-1">
                    <div className="font-semibold">{event.eventName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{event.clientName}</span>
                      <span className="text-muted-foreground/50">|</span>
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.eventDate), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span>{event.totalImages}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6">
                  {event.requirements.map((req) => (
                    <div key={req.id} className="space-y-3">
                      <div>
                        <h4 className="font-medium">{req.requirement}</h4>
                        {req.description && (
                          <p className="text-sm text-muted-foreground">{req.description}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {req.images.map((imageUrl, index) => (
                          <div
                            key={imageUrl}
                            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                          >
                            <img
                              src={imageUrl}
                              alt={`${req.requirement} image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openLightbox(req.images, index)}
                              data-testid={`img-gallery-${req.id}-${index}`}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ requirementId: req.id, imageUrl });
                              }}
                              data-testid={`button-delete-image-${req.id}-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
              onClick={() => setLightboxOpen(false)}
              data-testid="button-close-lightbox"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {lightboxImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 text-white hover:bg-white/20 z-10"
                  onClick={() => navigateLightbox("prev")}
                  data-testid="button-lightbox-prev"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-white hover:bg-white/20 z-10"
                  onClick={() => navigateLightbox("next")}
                  data-testid="button-lightbox-next"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Gallery image"
              className="max-h-[80vh] max-w-full object-contain"
              data-testid="img-lightbox"
            />
            
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
