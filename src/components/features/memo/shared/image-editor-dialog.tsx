'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageEditor } from './image-editor';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (dataUrl: string) => void;
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: ImageEditorDialogProps) {
  const handleSave = (dataUrl: string) => {
    onSave(dataUrl);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        <ImageEditor
          imageUrl={imageUrl}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
