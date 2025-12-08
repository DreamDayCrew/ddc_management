import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Images, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Requirement } from "@shared/schema";

interface ImageItem {
  url: string;
  requirementName: string;
  requirementId: string;
  imageIndex: number;
}

interface EventGalleryProps {
  requirements: Requirement[];
  eventName?: string;
  eventId: string;
}

export function EventGallery({ requirements, eventName, eventId }: EventGalleryProps) {
  const [open, setOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const allImages: ImageItem[] = requirements
    .filter(req => req.images && req.images.length > 0)
    .flatMap(req => 
      (req.images || []).map((url, idx) => ({
        url,
        requirementName: req.requirement,
        requirementId: req.id,
        imageIndex: idx
      }))
    );

  const totalImages = allImages.length;

  const deleteMutation = useMutation({
    mutationFn: async ({ requirementId, imageUrl }: { requirementId: string; imageUrl: string }) => {
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) throw new Error("Requirement not found");
      
      const updatedImages = (requirement.images || []).filter(url => url !== imageUrl);
      
      const res = await apiRequest("PATCH", `/api/requirements/${requirementId}`, {
        images: updatedImages
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "requirements"] });
      toast({
        title: "Image deleted",
        description: "The image has been removed from the requirement.",
      });
      
      if (selectedImageIndex !== null) {
        if (totalImages <= 1) {
          setSelectedImageIndex(null);
          setOpen(false);
        } else if (selectedImageIndex >= totalImages - 1) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePrevious = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const handleNext = useCallback(() => {
    if (selectedImageIndex !== null && selectedImageIndex < totalImages - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, totalImages]);

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedImageIndex !== null) {
      const imageToDelete = allImages[selectedImageIndex];
      deleteMutation.mutate({
        requirementId: imageToDelete.requirementId,
        imageUrl: imageToDelete.url
      });
    }
    setDeleteConfirmOpen(false);
  };

  useEffect(() => {
    if (selectedImageIndex !== null && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [selectedImageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (deleteConfirmOpen) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedImageIndex(null);
      }
    };

    if (selectedImageIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedImageIndex, handlePrevious, handleNext, deleteConfirmOpen]);

  if (totalImages === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid="button-event-gallery">
            <Images className="h-4 w-4 mr-2" />
            Gallery ({totalImages})
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="max-w-4xl max-h-[90vh]" 
          data-testid="dialog-event-gallery"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="h-5 w-5" />
              {eventName ? `${eventName} - Gallery` : "Event Gallery"}
              <span className="text-sm font-normal text-muted-foreground">
                ({totalImages} {totalImages === 1 ? "image" : "images"})
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedImageIndex !== null ? (
            <div 
              ref={lightboxRef}
              tabIndex={-1}
              className="relative flex flex-col items-center outline-none"
            >
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteClick}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-image"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedImageIndex(null)}
                  data-testid="button-close-lightbox"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative w-full flex items-center justify-center">
                {selectedImageIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 z-10"
                    onClick={handlePrevious}
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                
                <img
                  src={allImages[selectedImageIndex].url}
                  alt={allImages[selectedImageIndex].requirementName}
                  className="max-h-[60vh] max-w-full object-contain rounded-md"
                  data-testid="img-lightbox"
                />
                
                {selectedImageIndex < totalImages - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 z-10"
                    onClick={handleNext}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="font-medium">{allImages[selectedImageIndex].requirementName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedImageIndex + 1} of {totalImages}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allImages.map((item, index) => (
                  <div
                    key={`${item.requirementId}-${item.imageIndex}`}
                    className="group cursor-pointer"
                    onClick={() => setSelectedImageIndex(index)}
                    data-testid={`gallery-image-${index}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                      <img
                        src={item.url}
                        alt={item.requirementName}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {item.requirementName}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
