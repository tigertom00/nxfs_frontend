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
      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-full p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ImageEditor
            imageUrl={imageUrl}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
