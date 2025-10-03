'use client';

import { Message } from '@/lib/api/chat/types';
import { File, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileMessageProps {
  message: Message;
}

export default function FileMessage({ message }: FileMessageProps) {
  const isImage = message.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* File preview for images */}
      {isImage && message.file_attachment && (
        <div className="rounded-lg overflow-hidden max-w-sm">
          <img
            src={message.file_attachment}
            alt={message.file_name || 'Image'}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )}

      {/* File info */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg max-w-sm">
        <div className="flex-shrink-0">
          {isImage ? (
            <ImageIcon className="h-8 w-8 text-primary" />
          ) : (
            <File className="h-8 w-8 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {message.file_name || 'Untitled file'}
          </p>
          {message.file_size && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(message.file_size)}
            </p>
          )}
        </div>

        {message.file_attachment && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            asChild
          >
            <a
              href={message.file_attachment}
              download={message.file_name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      {/* Caption */}
      {message.content && (
        <p className="text-sm text-foreground">{message.content}</p>
      )}
    </div>
  );
}
