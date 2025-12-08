import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Requirement } from "@shared/schema";

interface ImageItem {
  url: string;
  requirementName: string;
  requirementId: string;
}

interface EventGalleryProps {
  requirements: Requirement[];
  eventName?: string;
}

export function EventGallery({ requirements, eventName }: EventGalleryProps) {
  const [open, setOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const allImages: ImageItem[] = requirements
    .filter(req => req.images && req.images.length > 0)
    .flatMap(req => 
      (req.images || []).map(url => ({
        url,
        requirementName: req.requirement,
        requirementId: req.id
      }))
    );

  const totalImages = allImages.length;

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

  useEffect(() => {
    if (selectedImageIndex !== null && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [selectedImageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
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
  }, [selectedImageIndex, handlePrevious, handleNext]);

  if (totalImages === 0) {
    return null;
  }

  return (
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedImageIndex(null)}
              data-testid="button-close-lightbox"
            >
              <X className="h-5 w-5" />
            </Button>
            
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
                  key={`${item.requirementId}-${index}`}
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
  );
}
