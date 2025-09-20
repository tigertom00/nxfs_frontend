'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image, Music, Trash2, Copy } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useIntl } from '@/hooks/use-intl';
import { PostImage, PostAudio } from '@/types/api';
import { toast } from 'sonner';

interface MediaLibraryProps {
  postId: string;
  onInsert: (url: string, type: 'image' | 'audio') => void;
}

export function MediaLibrary({ postId, onInsert }: MediaLibraryProps) {
  const { t } = useIntl();
  const [images, setImages] = useState<PostImage[]>([]);
  const [audio, setAudio] = useState<PostAudio[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [postId]);

  const fetchMedia = async () => {
    try {
      // Note: We'll need to implement these endpoints if they don't exist
      // For now, we'll use the post data to get media
      const post = await postsAPI.getPost(postId);
      setImages(post.images || []);
      setAudio(post.audio || []);
    } catch (err: any) {
      setError(t('blog.media.errorLoadingMedia'));
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('blog.media.invalidImageType'));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('blog.media.imageTooLarge'));
      return;
    }

    try {
      setUploading(true);
      const response = await postsAPI.uploadImage(postId, file);
      setImages(prev => [...prev, response]);
      toast.success(t('blog.media.imageUploaded'));

      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('blog.media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleAudioUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error(t('blog.media.invalidAudioType'));
      return;
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast.error(t('blog.media.audioTooLarge'));
      return;
    }

    try {
      setUploading(true);
      const response = await postsAPI.uploadAudio(postId, file);
      setAudio(prev => [...prev, response]);
      toast.success(t('blog.media.audioUploaded'));

      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('blog.media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await postsAPI.deleteImage(postId, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success(t('blog.media.imageDeleted'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('blog.media.deleteError'));
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    try {
      await postsAPI.deleteAudio(postId, audioId);
      setAudio(prev => prev.filter(aud => aud.id !== audioId));
      toast.success(t('blog.media.audioDeleted'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('blog.media.deleteError'));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(t('blog.media.urlCopied'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="images">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            {t('blog.media.images')} ({images.length})
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            {t('blog.media.audio')} ({audio.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <div className="space-y-4">
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />
              <Button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? t('common.uploading') : t('blog.media.uploadImage')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-3">
                    <div className="aspect-video mb-3 bg-muted rounded overflow-hidden">
                      <img
                        src={image.image}
                        alt={image.file_name || 'Uploaded image'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium truncate">
                        {image.file_name || 'Unknown file'}
                      </p>

                      {image.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(image.file_size)}
                        </p>
                      )}

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onInsert(image.image, 'image')}
                          className="flex-1"
                        >
                          {t('blog.media.insert')}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(image.image)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteImage(image.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {images.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('blog.media.noImages')}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="space-y-4">
            <div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => handleAudioUpload(e.target.files)}
                className="hidden"
              />
              <Button
                onClick={() => audioInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? t('common.uploading') : t('blog.media.uploadAudio')}
              </Button>
            </div>

            <div className="space-y-3">
              {audio.map((audioFile) => (
                <Card key={audioFile.id}>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Music className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {audioFile.file_name || 'Unknown file'}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {audioFile.file_size && (
                              <span>{formatFileSize(audioFile.file_size)}</span>
                            )}
                            {audioFile.duration && (
                              <span>{Math.round(audioFile.duration)}s</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <audio controls className="w-full h-8">
                        <source src={audioFile.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onInsert(audioFile.audio, 'audio')}
                          className="flex-1"
                        >
                          {t('blog.media.insert')}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(audioFile.audio)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAudio(audioFile.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {audio.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('blog.media.noAudio')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}