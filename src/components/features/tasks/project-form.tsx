'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui';
import { Project, ProjectImage } from '@/types/api';
import { ProjectFormData } from '@/types/task';
import { ImageIcon, X } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const { language } = useUIStore();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    name_nb: project?.name_nb || '',
    description: project?.description || '',
    description_nb: project?.description_nb || '',
    status: project?.status || 'todo',
  });
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProjectImage[]>(project?.images || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!project) return;

    try {
      // Note: You'll need to implement the delete image API call
      // await projectsAPI.deleteImage(project.id.toString(), imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      console.log('Delete image:', imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const texts = {
    title: project
      ? language === 'no'
        ? 'Rediger Prosjekt'
        : 'Edit Project'
      : language === 'no'
        ? 'Nytt Prosjekt'
        : 'New Project',
    projectName: language === 'no' ? 'Prosjektnavn' : 'Project Name',
    projectNameNorwegian:
      language === 'no' ? 'Prosjektnavn (Norsk)' : 'Project Name (Norwegian)',
    description: language === 'no' ? 'Beskrivelse' : 'Description',
    descriptionNorwegian:
      language === 'no' ? 'Beskrivelse (Norsk)' : 'Description (Norwegian)',
    status: language === 'no' ? 'Status' : 'Status',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
    todo: language === 'no' ? 'To Do' : 'To Do',
    inProgress: language === 'no' ? 'Pågår' : 'In Progress',
    completed: language === 'no' ? 'Fullført' : 'Completed',
    attachments: language === 'no' ? 'Vedlegg' : 'Attachments',
    attachmentsDescription: language === 'no'
      ? 'Last opp bilder relatert til prosjektet'
      : 'Upload images related to the project',
    nameRequired: language === 'no' ? 'Prosjektnavn er påkrevd' : 'Project name is required',
    existingImages: language === 'no' ? 'Eksisterende Bilder' : 'Existing Images',
    deleteImage: language === 'no' ? 'Slett bilde' : 'Delete image',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">{texts.projectName} *</Label>
          <Input
            id="project-name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            disabled={loading}
            placeholder="Website Redesign, Mobile App, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name-nb">
            {texts.projectNameNorwegian}
          </Label>
          <Input
            id="project-name-nb"
            value={formData.name_nb || ''}
            onChange={(e) =>
              setFormData({ ...formData, name_nb: e.target.value })
            }
            disabled={loading}
            placeholder="Nettside Redesign, Mobil App, etc."
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="project-status">{texts.status}</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'todo' | 'in_progress' | 'completed') =>
            setFormData({ ...formData, status: value })
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">{texts.todo}</SelectItem>
            <SelectItem value="in_progress">{texts.inProgress}</SelectItem>
            <SelectItem value="completed">{texts.completed}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="project-description">{texts.description}</Label>
        <Textarea
          id="project-description"
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={loading}
          rows={3}
          placeholder="Brief description of the project..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description-nb">
          {texts.descriptionNorwegian}
        </Label>
        <Textarea
          id="project-description-nb"
          value={formData.description_nb || ''}
          onChange={(e) =>
            setFormData({ ...formData, description_nb: e.target.value })
          }
          disabled={loading}
          rows={3}
          placeholder="Kort beskrivelse av prosjektet..."
        />
      </div>

      {/* Existing Images Section */}
      {project && existingImages.length > 0 && (
        <div className="space-y-2">
          <Label>{texts.existingImages}</Label>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={image.image}
                    alt="Project image"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title={texts.deleteImage}
                >
                  <X className="h-3 w-3" />
                </Button>
                {image.file_name && (
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {image.file_name}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="space-y-2">
        <FileUpload
          label={texts.attachments}
          description={texts.attachmentsDescription}
          onFilesChange={setAttachedFiles}
          value={attachedFiles}
          acceptedTypes="image/*"
          maxFiles={5}
          maxFileSize={10}
          showCamera={true}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {texts.cancel}
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
        >
          {loading
            ? texts.saving
            : texts.save}
        </Button>
      </div>
    </form>
  );
}