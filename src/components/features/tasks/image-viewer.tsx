'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores';
import { TaskImage } from '@/lib/api';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  images: TaskImage[];
  taskTitle: string;
}

export function ImageViewer({
  isOpen,
  onOpenChange,
  images,
  taskTitle,
}: ImageViewerProps) {
  const { language } = useUIStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const texts = {
    title: language === 'no' ? 'Bilder for oppgave' : 'Images for task',
    noImages:
      language === 'no' ? 'Ingen bilder tilgjengelig' : 'No images available',
    download: language === 'no' ? 'Last ned' : 'Download',
    close: language === 'no' ? 'Lukk' : 'Close',
    zoomIn: language === 'no' ? 'Zoom inn' : 'Zoom in',
    zoomOut: language === 'no' ? 'Zoom ut' : 'Zoom out',
    rotate: language === 'no' ? 'Roter' : 'Rotate',
    fullScreen: language === 'no' ? 'Fullskjerm' : 'Full screen',
    previous: language === 'no' ? 'Forrige' : 'Previous',
    next: language === 'no' ? 'Neste' : 'Next',
    imageNumber: language === 'no' ? 'Bilde' : 'Image',
    of: language === 'no' ? 'av' : 'of',
    uploadedOn: language === 'no' ? 'Lastet opp' : 'Uploaded on',
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    try {
      // Handle different date formats that might come from the API
      let date: Date;

      // If it's already a valid ISO string or timestamp
      if (
        dateString.includes('T') ||
        dateString.includes('-') ||
        !isNaN(Number(dateString))
      ) {
        date = new Date(dateString);
      } else {
        // Try parsing as is
        date = new Date(dateString);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if can't parse
      }

      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Failed to format date:', dateString, error);
      return dateString; // Return original string if formatting fails
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setZoom(1);
    setRotation(0);
  };

  const handleCloseFullScreen = () => {
    setSelectedImageIndex(null);
    setZoom(1);
    setRotation(0);
  };

  const handlePrevious = () => {
    if (selectedImageIndex === null) return;
    const newIndex =
      selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    setSelectedImageIndex(newIndex);
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    if (selectedImageIndex === null) return;
    const newIndex =
      selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    setSelectedImageIndex(newIndex);
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = (image: TaskImage) => {
    const link = document.createElement('a');
    link.href = image.image;
    link.download = image.file_name || `image-${image.id}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImageIndex === null) return;

    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        handleCloseFullScreen();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotate();
        break;
    }
  };

  if (images.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogDescription>{taskTitle}</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <p>{texts.noImages}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Image Gallery Modal */}
      <Dialog
        open={isOpen && selectedImageIndex === null}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogDescription>{taskTitle}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleImageClick(index)}
              >
                <div className="aspect-square">
                  <img
                    src={image.image}
                    alt={image.file_name || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Info badges */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="space-y-1">
                    {image.file_name && (
                      <p className="text-white text-xs truncate font-medium">
                        {image.file_name}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-white/80 text-xs">
                        {formatDate(image.upload_date)}
                      </p>
                      {image.file_size && (
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(image.file_size)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={handleCloseFullScreen}>
          <DialogContent
            className="w-screen h-screen max-w-none max-h-none p-0 bg-black border-none fixed inset-0 m-0 translate-x-0 translate-y-0"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>
                  {texts.imageNumber} {selectedImageIndex + 1} {texts.of}{' '}
                  {images.length}
                </DialogTitle>
              </VisuallyHidden>
            </DialogHeader>
            {/* Controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-sm">
                  {texts.imageNumber} {selectedImageIndex + 1} {texts.of}{' '}
                  {images.length}
                </Badge>
                {images[selectedImageIndex].file_name && (
                  <Badge
                    variant="outline"
                    className="text-sm bg-black/50 text-white border-white/20"
                  >
                    {images[selectedImageIndex].file_name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(images[selectedImageIndex])}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseFullScreen}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Main image */}
            <div className="w-screen h-screen flex items-center justify-center p-16">
              <img
                src={images[selectedImageIndex].image}
                alt={
                  images[selectedImageIndex].file_name ||
                  `Image ${selectedImageIndex + 1}`
                }
                className="max-w-[calc(100vw-8rem)] max-h-[calc(100vh-8rem)] object-contain transition-transform"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="bg-black/50 rounded p-3 text-white text-sm">
                <p>
                  {texts.uploadedOn}:{' '}
                  {formatDate(images[selectedImageIndex].upload_date)}
                </p>
                {images[selectedImageIndex].file_size && (
                  <p>{formatFileSize(images[selectedImageIndex].file_size)}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
