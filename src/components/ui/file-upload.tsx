'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores';
import { Camera, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  label?: string;
  description?: string;
  showCamera?: boolean;
  value?: File[];
}

export function FileUpload({
  onFilesChange,
  acceptedTypes = 'image/*',
  maxFiles = 5,
  maxFileSize = 10,
  label,
  description,
  showCamera = true,
  value = [],
}: FileUploadProps) {
  const { language } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const texts = {
    selectFiles: language === 'no' ? 'Velg filer' : 'Select files',
    takePhoto: language === 'no' ? 'Ta bilde' : 'Take photo',
    dragDrop:
      language === 'no'
        ? 'Dra og slipp filer her, eller'
        : 'Drag and drop files here, or',
    click: language === 'no' ? 'klikk for å velge' : 'click to select',
    maxFiles: language === 'no' ? 'Maks filer' : 'Max files',
    maxSize: language === 'no' ? 'Maks størrelse' : 'Max size',
    mb: language === 'no' ? 'MB' : 'MB',
    remove: language === 'no' ? 'Fjern' : 'Remove',
    fileTooLarge: language === 'no' ? 'Fil for stor' : 'File too large',
    tooManyFiles: language === 'no' ? 'For mange filer' : 'Too many files',
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(
          `${file.name}: ${texts.fileTooLarge} (${texts.maxSize}: ${maxFileSize}${texts.mb})`
        );
        continue;
      }

      // Check total file count
      if (value.length + validFiles.length >= maxFiles) {
        alert(`${texts.tooManyFiles} (${texts.maxFiles}: ${maxFiles})`);
        break;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesChange([...value, ...validFiles]);
      }
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesChange([...value, ...validFiles]);
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptedTypes;
      fileInputRef.current.click();
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.accept = 'image/*';
      cameraInputRef.current.setAttribute('capture', 'environment');
      cameraInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {texts.dragDrop}{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={handleUploadClick}
              >
                {texts.click}
              </button>
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
            >
              <Upload className="mr-2 h-4 w-4" />
              {texts.selectFiles}
            </Button>

            {showCamera && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCameraClick}
              >
                <Camera className="mr-2 h-4 w-4" />
                {texts.takePhoto}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* File Info */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="text-xs text-muted-foreground space-x-4">
        <span>
          {texts.maxFiles}: {maxFiles}
        </span>
        <span>
          {texts.maxSize}: {maxFileSize}
          {texts.mb}
        </span>
      </div>

      {/* Selected Files */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {language === 'no' ? 'Valgte filer' : 'Selected files'} (
            {value.length})
          </Label>
          <div className="grid gap-2">
            {value.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        multiple={maxFiles > 1}
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
