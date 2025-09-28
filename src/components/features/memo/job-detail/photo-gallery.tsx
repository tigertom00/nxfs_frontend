'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { jobImagesAPI } from '@/lib/api';
import { JobImage } from '@/lib/api';
import { Camera, FolderOpen, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryProps {
  jobId: number;
}

export function PhotoGallery({ jobId }: PhotoGalleryProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<JobImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos for the job
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const jobPhotos = await jobImagesAPI.getJobImages();
        // Filter photos for this specific job
        const jobSpecificPhotos = jobPhotos.filter(
          (photo) => photo.jobb === jobId
        );
        setPhotos(jobSpecificPhotos);
      } catch (error) {
        console.error('Failed to load photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [jobId]);

  const handleTakePhoto = () => {
    // Trigger camera input
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    // Trigger file input
    fileInputRef.current?.click();
  };

  const handleBulkUpload = () => {
    // For bulk upload, just trigger the regular file input with multiple selection
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File): Promise<JobImage> => {
    try {
      const uploadedImage = await jobImagesAPI.uploadJobImage({
        image: file,
        jobb: jobId,
      });
      return uploadedImage;
    } catch (error) {
      console.error('Failed to upload file:', file.name, error);
      throw error;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isUnderLimit = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isImage) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return false;
      }

      if (!isUnderLimit) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Upload files one by one
      const uploadedImages: JobImage[] = [];

      for (const file of validFiles) {
        try {
          const uploadedImage = await uploadFile(file);
          uploadedImages.push(uploadedImage);
        } catch (error) {
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (uploadedImages.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedImages]);
        toast({
          title: 'Upload successful',
          description: `${uploadedImages.length} photo(s) uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload error',
        description: 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photo: JobImage) => {
    try {
      await jobImagesAPI.deleteJobImage(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast({
        title: 'Photo deleted',
        description: 'Photo has been removed from the job',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the photo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Photos</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Photos ({photos.length})</h3>
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="aspect-square relative group">
              <img
                src={photo.image}
                alt={`Photo ${photo.id}`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  // Handle broken image
                  e.currentTarget.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDMuNVYyMC41SDNWMy41SDIxWk0yMiAySDJDMS40NSAyIDEgMi40NSAxIDNWMjFDMSAyMS41NSAxLjQ1IDIyIDIgMjJIMjJDMjIuNTUgMjIgMjMgMjEuNTUgMjMgMjFWM0MyMyAyLjQ1IDIyLjU1IDIgMjIgMloiIGZpbGw9IiNjY2MiLz4KPC9zdmc+';
                }}
              />
              <button
                onClick={() => handleDeletePhoto(photo)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No photos yet</p>
          <p className="text-sm">Add photos to document your work</p>
        </div>
      )}

      {/* Photo Controls */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={handleTakePhoto}
          variant="outline"
          size="sm"
          className="h-12 flex flex-col items-center justify-center"
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mb-1" />
          <span className="text-xs">Camera</span>
        </Button>

        <Button
          onClick={handleChooseFromGallery}
          variant="outline"
          size="sm"
          className="h-12 flex flex-col items-center justify-center"
          disabled={uploading}
        >
          <FolderOpen className="h-4 w-4 mb-1" />
          <span className="text-xs">Gallery</span>
        </Button>

        <Button
          onClick={handleBulkUpload}
          variant="outline"
          size="sm"
          className="h-12 flex flex-col items-center justify-center"
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mb-1" />
          <span className="text-xs">Bulk</span>
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="text-xs text-muted-foreground text-center">
        Photo upload and management now available! Max 10MB per image.
      </div>
    </div>
  );
}
