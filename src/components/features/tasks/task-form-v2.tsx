/**
 * Task Form V2 - Migrated to react-hook-form + zod validation
 * This is the new standardized form pattern for the application
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { Form } from '@/components/ui/form';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  type SelectOption,
} from '@/components/ui/form-components';
import { FileUpload } from '@/components/ui/file-upload';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/stores/ui';
import {
  Task,
  Category,
  Project,
  CreateTaskPayload as TaskFormData,
} from '@/lib/api';
import {
  createTaskSchema,
  type CreateTaskFormData,
} from '@/lib/validations/schemas';
import { handleFormSubmit } from '@/lib/validations/utils';

interface TaskFormV2Props {
  task?: Task;
  categories: Category[];
  projects: Project[];
  userId: string;
  onSubmit: (data: TaskFormData, files?: File[]) => Promise<void>;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
}

export function TaskFormV2({
  task,
  categories,
  projects,
  userId,
  onSubmit,
  onCancel,
  onDelete,
}: TaskFormV2Props) {
  const { language } = useUIStore();
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form with react-hook-form + zod
  // Let TypeScript infer the form type from the schema
  const form = useForm({
    resolver: zodResolver(createTaskSchema),
    mode: 'onBlur',
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: (task?.status || 'todo') as 'todo' | 'in_progress' | 'completed',
      priority: (task?.priority || 'medium') as 'low' | 'medium' | 'high',
      due_date: task?.due_date ? task.due_date.split('T')[0] : undefined,
      estimated_time: task?.estimated_time || undefined,
      category: task?.category || [],
      project: task?.project || undefined,
      user_id: userId,
    },
  });

  const {
    control,
    handleSubmit: handleFormSubmitHook,
    formState: { isSubmitting, errors },
  } = form;

  // Translations
  const texts = {
    title: task
      ? language === 'no'
        ? 'Rediger Oppgave'
        : 'Edit Task'
      : language === 'no'
        ? 'Ny Oppgave'
        : 'New Task',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    delete: language === 'no' ? 'Slett Oppgave' : 'Delete Task',
    deleteConfirm:
      language === 'no'
        ? 'Er du sikker på at du vil slette denne oppgaven?'
        : 'Are you sure you want to delete this task?',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
    attachments: language === 'no' ? 'Vedlegg' : 'Attachments',
    attachmentsDescription:
      language === 'no'
        ? 'Last opp bilder eller ta bilder relatert til oppgaven'
        : 'Upload images or take photos related to the task',
  };

  // Status options
  const statusOptions: SelectOption[] = [
    {
      value: 'todo',
      label: language === 'no' ? 'Å gjøre' : 'To Do',
    },
    {
      value: 'in_progress',
      label: language === 'no' ? 'Pågår' : 'In Progress',
    },
    {
      value: 'completed',
      label: language === 'no' ? 'Fullført' : 'Completed',
    },
  ];

  // Priority options
  const priorityOptions: SelectOption[] = [
    {
      value: 'low',
      label: language === 'no' ? 'Lav' : 'Low',
    },
    {
      value: 'medium',
      label: language === 'no' ? 'Medium' : 'Medium',
    },
    {
      value: 'high',
      label: language === 'no' ? 'Høy' : 'High',
    },
  ];

  // Project options
  const projectOptions: SelectOption[] = [
    {
      value: '0',
      label: language === 'no' ? 'Ingen prosjekt' : 'No project',
    },
    ...projects.map((project) => ({
      value: project.id.toString(),
      label:
        language === 'no' && project.name_nb ? project.name_nb : project.name,
    })),
  ];

  // Form submission handler with validation
  const onFormSubmit = async (data: CreateTaskFormData) => {
    await handleFormSubmit(
      async (validatedData) => {
        // Convert project from string to number if needed
        const payload: TaskFormData = {
          ...validatedData,
          project:
            validatedData.project && validatedData.project !== 0
              ? validatedData.project
              : undefined,
        };

        await onSubmit(payload, attachedFiles);
      },
      data,
      {
        successMessage: task
          ? language === 'no'
            ? 'Oppgave oppdatert'
            : 'Task updated'
          : language === 'no'
            ? 'Oppgave opprettet'
            : 'Task created',
        errorMessage: language === 'no' ? 'En feil oppstod' : 'An error occurred',
      }
    );
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleFormSubmitHook(onFormSubmit)}
        className="space-y-6"
      >
        {/* Title */}
        <FormInput
          control={control}
          name="title"
          label={language === 'no' ? 'Tittel' : 'Title'}
          placeholder={language === 'no' ? 'Skriv inn tittel' : 'Enter title'}
          disabled={isSubmitting}
          required
        />

        {/* Description */}
        <FormTextarea
          control={control}
          name="description"
          label={language === 'no' ? 'Beskrivelse' : 'Description'}
          placeholder={
            language === 'no' ? 'Skriv inn beskrivelse' : 'Enter description'
          }
          rows={3}
          maxLength={2000}
          showCharacterCount
          disabled={isSubmitting}
          required
        />

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            control={control}
            name="status"
            label={language === 'no' ? 'Status' : 'Status'}
            options={statusOptions}
            disabled={isSubmitting}
          />

          <FormSelect
            control={control}
            name="priority"
            label={language === 'no' ? 'Prioritet' : 'Priority'}
            options={priorityOptions}
            disabled={isSubmitting}
          />
        </div>

        {/* Due Date and Estimated Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="due_date">
              {language === 'no' ? 'Forfallsdato' : 'Due Date'}
            </Label>
            <DatePicker
              value={form.watch('due_date') || ''}
              onChange={(date) => form.setValue('due_date', date)}
              placeholder={language === 'no' ? 'Velg dato' : 'Select date'}
              disabled={isSubmitting}
            />
            {errors.due_date && (
              <p className="text-sm text-destructive">
                {errors.due_date.message}
              </p>
            )}
          </div>

          <FormInput
            control={control}
            name="estimated_time"
            label={
              language === 'no' ? 'Estimert tid (timer)' : 'Estimated time (hours)'
            }
            type="number"
            placeholder="0"
            disabled={isSubmitting}
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label>{language === 'no' ? 'Kategorier' : 'Categories'}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-4">
              {categories.map((category) => (
                <FormCheckbox
                  key={category.id}
                  control={control}
                  name="category"
                  checkboxLabel={
                    language === 'no' && category.name_nb
                      ? category.name_nb
                      : category.name
                  }
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Project */}
        {projects.length > 0 && (
          <FormSelect
            control={control}
            name="project"
            label={language === 'no' ? 'Prosjekt' : 'Project'}
            options={projectOptions}
            emptyOption={language === 'no' ? 'Velg prosjekt' : 'Select project'}
            disabled={isSubmitting}
          />
        )}

        {/* File Upload */}
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

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {task && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {texts.delete}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? texts.saving : texts.save}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={language === 'no' ? 'Bekreft sletting' : 'Confirm deletion'}
        description={texts.deleteConfirm}
        confirmText={language === 'no' ? 'Slett' : 'Delete'}
        cancelText={texts.cancel}
        variant="destructive"
      />
    </Form>
  );
}
