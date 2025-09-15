'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/stores/ui';
import { Task, Category, Project, TaskFormData } from '@/types/task';

interface TaskFormProps {
  task?: Task;
  categories: Category[];
  projects: Project[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

export function TaskForm({ task, categories, projects, onSubmit, onCancel }: TaskFormProps) {
  const { language } = useUIStore();
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    estimated_time: task?.estimated_time?.toString() || '',
    category: task?.category || [],
    project: task?.project || undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    title: task
      ? language === 'no'
        ? 'Rediger Oppgave'
        : 'Edit Task'
      : language === 'no'
      ? 'Ny Oppgave'
      : 'New Task',
    description: language === 'no' ? 'Beskrivelse' : 'Description',
    status: language === 'no' ? 'Status' : 'Status',
    priority: language === 'no' ? 'Prioritet' : 'Priority',
    dueDate: language === 'no' ? 'Forfallsdato' : 'Due Date',
    estimatedTime:
      language === 'no' ? 'Estimert Tid (timer)' : 'Estimated Time (hours)',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    todo: language === 'no' ? 'To Do' : 'To Do',
    inProgress: language === 'no' ? 'Pågår' : 'In Progress',
    completed: language === 'no' ? 'Fullført' : 'Completed',
    low: language === 'no' ? 'Lav' : 'Low',
    medium: language === 'no' ? 'Medium' : 'Medium',
    high: language === 'no' ? 'Høy' : 'High',
    categories: language === 'no' ? 'Kategorier' : 'Categories',
    project: language === 'no' ? 'Prosjekt' : 'Project',
    noProject: language === 'no' ? 'Ingen prosjekt' : 'No project',
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, category: [...(formData.category || []), categoryId] });
    } else {
      setFormData({ ...formData, category: (formData.category || []).filter(id => id !== categoryId) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='title'>{texts.title}</Label>
        <Input
          id='title'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>{texts.description}</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          disabled={loading}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='status'>{texts.status}</Label>
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
              <SelectItem value='todo'>{texts.todo}</SelectItem>
              <SelectItem value='in_progress'>{texts.inProgress}</SelectItem>
              <SelectItem value='completed'>{texts.completed}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='priority'>{texts.priority}</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high') =>
              setFormData({ ...formData, priority: value })
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='low'>{texts.low}</SelectItem>
              <SelectItem value='medium'>{texts.medium}</SelectItem>
              <SelectItem value='high'>{texts.high}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='due_date'>{texts.dueDate}</Label>
          <Input
            id='due_date'
            type='date'
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
            disabled={loading}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='estimated_time'>{texts.estimatedTime}</Label>
          <Input
            id='estimated_time'
            type='number'
            step='0.5'
            min='0'
            value={formData.estimated_time}
            onChange={(e) =>
              setFormData({ ...formData, estimated_time: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className='space-y-2'>
          <Label>{texts.categories}</Label>
          <div className='grid grid-cols-2 gap-2 max-h-32 overflow-y-auto'>
            {categories.map((category) => (
              <div key={category.id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`category-${category.id}`}
                  checked={formData.category?.includes(category.id) || false}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor={`category-${category.id}`} className='text-sm cursor-pointer'>
                  {language === 'no' && category.name_nb ? category.name_nb : category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className='space-y-2'>
          <Label htmlFor='project'>{texts.project}</Label>
          <Select
            value={formData.project?.toString() || '0'}
            onValueChange={(value) =>
              setFormData({ ...formData, project: value === '0' ? undefined : parseInt(value) })
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={texts.noProject} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='0'>{texts.noProject}</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {language === 'no' && project.name_nb ? project.name_nb : project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='flex justify-end space-x-2 pt-4'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          {texts.cancel}
        </Button>
        <Button type='submit' disabled={loading}>
          {loading
            ? language === 'no'
              ? 'Lagrer...'
              : 'Saving...'
            : texts.save}
        </Button>
      </div>
    </form>
  );
}