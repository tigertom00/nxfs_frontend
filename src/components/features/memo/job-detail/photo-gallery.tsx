'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { jobImagesAPI, jobFilesAPI } from '@/lib/api';
import { JobImage, JobFile } from '@/lib/api';
import {
  Camera,
  FolderOpen,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUIStore } from '@/stores';
import { useIntl } from '@/hooks/use-intl';
import { ImageEditorDialog } from '@/components/features/memo/shared/image-editor-dialog';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

interface PhotoGalleryProps {
  jobId: number;
  ordreNr?: string; // Order number for API filtering
}

export function PhotoGallery({ jobId, ordreNr }: PhotoGalleryProps) {
  const { toast } = useToast();
  const { language } = useUIStore();
  const { t } = useIntl();
  const [photos, setPhotos] = useState<JobImage[]>([]);
  const [documents, setDocuments] = useState<JobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('images');
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'image' | 'document';
    item: JobImage | JobFile;
  } | null>(null);
  const [editingImage, setEditingImage] = useState<JobImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos and files for the job
  useEffect(() => {
    const loadData = async () => {
      try {
        // API expects numeric job ID
        const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;

        // Load images
        const jobPhotos = await jobImagesAPI.getImagesByJob(jobIdToUse);
        const photosArray = Array.isArray(jobPhotos)
          ? jobPhotos
          : 'images' in jobPhotos && Array.isArray(jobPhotos.images)
            ? jobPhotos.images
            : [];

        // Fix HTTP URLs to HTTPS for proper loading
        const photosWithHttps = photosArray.map((photo) => ({
          ...photo,
          image: photo.image?.replace('http://', 'https://') || photo.image,
        }));

        setPhotos(photosWithHttps);

        // Load files
        const jobFiles = await jobFilesAPI.getFilesByJob(jobIdToUse);
        const filesArray = Array.isArray(jobFiles)
          ? jobFiles
          : 'files' in jobFiles && Array.isArray(jobFiles.files)
            ? jobFiles.files
            : [];

        // Fix HTTP URLs to HTTPS for proper loading
        const filesWithHttps = filesArray.map((file) => ({
          ...file,
          file: file.file?.replace('http://', 'https://') || file.file,
        }));

        setDocuments(filesWithHttps);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId, ordreNr]);

  const handleTakePhoto = () => {
    // Trigger camera input
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    // Trigger file input (supports multiple files)
    imageInputRef.current?.click();
  };

  const handleUploadDocument = () => {
    // Trigger document input
    documentInputRef.current?.click();
  };

  const uploadImage = async (file: File): Promise<JobImage> => {
    try {
      // API expects numeric job ID
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;
      const uploadedImage = await jobImagesAPI.uploadJobImage({
        image: file,
        jobb: jobIdToUse,
      });
      return uploadedImage;
    } catch (error) {
      throw error;
    }
  };

  const uploadDocument = async (file: File): Promise<JobFile> => {
    try {
      // API expects numeric job ID
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;
      const uploadedFile = await jobFilesAPI.uploadJobFile({
        file: file,
        jobb: jobIdToUse,
      });
      return uploadedFile;
    } catch (error) {
      throw error;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'document' = 'image'
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isUnderLimit = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (type === 'image' && !isImage) {
        toast({
          title: t('memo.photos.invalidType'),
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return false;
      }

      if (!isUnderLimit) {
        toast({
          title: t('memo.photos.fileTooLarge'),
          description: `${file.name} ${t('memo.photos.fileTooLarge').toLowerCase()}`,
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
      if (type === 'image') {
        const uploadedImages: JobImage[] = [];
        for (const file of validFiles) {
          try {
            const uploadedImage = await uploadImage(file);
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
      } else {
        const uploadedDocs: JobFile[] = [];
        for (const file of validFiles) {
          try {
            const uploadedDoc = await uploadDocument(file);
            uploadedDocs.push(uploadedDoc);
          } catch (error) {
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${file.name}`,
              variant: 'destructive',
            });
          }
        }

        if (uploadedDocs.length > 0) {
          setDocuments((prev) => [...prev, ...uploadedDocs]);
          toast({
            title: 'Upload successful',
            description: `${uploadedDocs.length} file(s) uploaded successfully`,
          });
        }
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'image') {
        const image = deleteTarget.item as JobImage;
        await jobImagesAPI.deleteJobImage(image.id);
        setPhotos((prev) => prev.filter((p) => p.id !== image.id));
        toast({
          title: language === 'no' ? 'Bilde slettet' : 'Photo deleted',
          description:
            language === 'no'
              ? 'Bildet er fjernet fra jobben'
              : 'Photo has been removed from the job',
        });
      } else {
        const doc = deleteTarget.item as JobFile;
        await jobFilesAPI.deleteJobFile(doc.id);
        setDocuments((prev) => prev.filter((p) => p.id !== doc.id));
        toast({
          title: language === 'no' ? 'Fil slettet' : 'File deleted',
          description:
            language === 'no'
              ? 'Filen er fjernet fra jobben'
              : 'File has been removed from the job',
        });
      }
    } catch (error) {
      toast({
        title: language === 'no' ? 'Sletting mislyktes' : 'Delete failed',
        description:
          language === 'no'
            ? 'Kunne ikke slette elementet'
            : 'Failed to delete the item',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '?';
  };

  const handleSaveEditedImage = async (dataUrl: string) => {
    if (!editingImage) return;

    try {
      setUploading(true);

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create file from blob
      const file = new File(
        [blob],
        `edited_${editingImage.name || `image_${Date.now()}.png`}`,
        {
          type: 'image/png',
        }
      );

      // Upload as new image
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;
      const uploadedImage = await jobImagesAPI.uploadJobImage({
        image: file,
        jobb: jobIdToUse,
      });

      // Add to photos list
      setPhotos((prev) => [...prev, uploadedImage]);

      toast({
        title: language === 'no' ? 'Bilde lagret' : 'Image saved',
        description:
          language === 'no'
            ? 'Det redigerte bildet er lastet opp'
            : 'Edited image has been uploaded',
      });

      setEditingImage(null);
    } catch (error) {
      toast({
        title: language === 'no' ? 'Feil' : 'Error',
        description:
          language === 'no'
            ? 'Kunne ikke lagre redigert bilde'
            : 'Failed to save edited image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Photos & Files</h3>
          </div>
          <div className="animate-pulse mt-4">
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images">
            <ImageIcon className="h-4 w-4 mr-2" />
            {t('memo.photos.images')} ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4 mr-2" />
            {t('memo.photos.documents')} ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                {t('memo.photos.title')} ({photos.length})
              </h3>
              {uploading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
              )}
            </div>
            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="space-y-2">
                    <div
                      className="aspect-square relative cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-colors"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={photo.image}
                        alt={photo.name || `Photo ${photo.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Handle broken image
                          e.currentTarget.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDMuNVYyMC41SDNWMy41SDIxWk0yMiAySDJDMS40NSAyIDEgMi40NSAxIDNWMjFDMSAyMS41NSAxLjQ1IDIyIDIgMjJIMjJDMjIuNTUgMjIgMjMgMjEuNTUgMjMgMjFWM0MyMyAyLjQ1IDIyLjU1IDIgMjIgMloiIGZpbGw9IiNjY2MiLz4KPC9zdmc+';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingImage(photo);
                        }}
                        className="h-8 w-8 p-0"
                        aria-label="Edit photo"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: 'image', item: photo });
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        aria-label="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {photos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('memo.photos.noPhotos')}</p>
                <p className="text-sm">
                  {t('memo.photos.noPhotosDescription')}
                </p>
              </div>
            )}

            {/* Photo Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleTakePhoto}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center"
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('memo.photos.camera')}</span>
              </Button>

              <Button
                onClick={handleChooseFromGallery}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center"
                disabled={uploading}
              >
                <FolderOpen className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('memo.photos.gallery')}</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                Photos & Files ({documents.length})
              </h3>
              {uploading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
              )}
            </div>
            {/* Files List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {getFileExtension(doc.file)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary truncate block"
                        >
                          View file
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setDeleteTarget({ type: 'document', item: doc })
                      }
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Delete file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('memo.photos.noFiles')}</p>
                <p className="text-sm">{t('memo.photos.noFilesDescription')}</p>
              </div>
            )}

            {/* File Upload Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleUploadDocument}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('memo.photos.upload')}</span>
              </Button>

              <Button
                onClick={handleUploadDocument}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center"
                disabled={uploading}
              >
                <FolderOpen className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('common.choose')}</span>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
        disabled={uploading}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
        disabled={uploading}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept="*/*"
        multiple
        onChange={(e) => handleFileSelect(e, 'document')}
        className="hidden"
        disabled={uploading}
      />

      <div className="text-xs text-muted-foreground text-center mt-2">
        {t('memo.photos.maxSize')}. {t('memo.photos.images')}{' '}
        {language === 'no' ? 'og' : 'and'}{' '}
        {t('memo.photos.documents').toLowerCase()}{' '}
        {language === 'no' ? 'støttes' : 'supported'}.
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'image'
            ? language === 'no'
              ? 'Bekreft sletting av bilde'
              : 'Confirm photo deletion'
            : language === 'no'
              ? 'Bekreft sletting av fil'
              : 'Confirm file deletion'
        }
        description={
          deleteTarget?.type === 'image'
            ? language === 'no'
              ? 'Er du sikker på at du vil slette dette bildet? Denne handlingen kan ikke angres.'
              : 'Are you sure you want to delete this photo? This action cannot be undone.'
            : language === 'no'
              ? 'Er du sikker på at du vil slette denne filen? Denne handlingen kan ikke angres.'
              : 'Are you sure you want to delete this file? This action cannot be undone.'
        }
        confirmText={language === 'no' ? 'Slett' : 'Delete'}
        cancelText={language === 'no' ? 'Avbryt' : 'Cancel'}
        variant="destructive"
      />

      {/* Image Editor Dialog */}
      {editingImage && (
        <ImageEditorDialog
          open={!!editingImage}
          onOpenChange={(open) => !open && setEditingImage(null)}
          imageUrl={editingImage.image}
          onSave={handleSaveEditedImage}
        />
      )}

      {/* Lightbox for full-screen image viewing */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={photos.map((photo) => ({
          src: photo.image,
          alt: photo.name || `Photo ${photo.id}`,
        }))}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
      />
    </div>
  );
}
