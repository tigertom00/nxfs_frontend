'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import ChatBot from '@/components/chat/chatbot';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { tasksAPI } from '@/lib/api';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Timer,
  Target,
  Loader2,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_time?: number;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_time?: string;
}

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const { language } = useUIStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'in_progress':
        return <Clock className='h-4 w-4 text-blue-500' />;
      default:
        return <Circle className='h-4 w-4 text-gray-400' />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return language === 'no' ? 'To Do' : 'To Do';
      case 'in_progress':
        return language === 'no' ? 'Pågår' : 'In Progress';
      case 'completed':
        return language === 'no' ? 'Fullført' : 'Completed';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return language === 'no' ? 'Lav' : 'Low';
      case 'medium':
        return language === 'no' ? 'Medium' : 'Medium';
      case 'high':
        return language === 'no' ? 'Høy' : 'High';
      default:
        return priority;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className='h-full hover:shadow-lg transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-2 flex-1'>
            {getStatusIcon(task.status)}
            <CardTitle className='text-lg line-clamp-2'>{task.title}</CardTitle>
          </div>
          <div className='flex items-center space-x-1 ml-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onEdit(task)}
              className='h-8 w-8 p-0'
            >
              <Edit3 className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(task.id)}
              className='h-8 w-8 p-0 text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Badge className={getPriorityColor(task.priority)}>
            {getPriorityText(task.priority)}
          </Badge>
          <Badge variant='outline'>{getStatusText(task.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        {task.description && (
          <CardDescription className='mb-4 line-clamp-3'>
            {task.description}
          </CardDescription>
        )}

        <div className='space-y-2 text-sm text-muted-foreground'>
          {task.due_date && (
            <div className='flex items-center space-x-1'>
              <Calendar className='h-3 w-3' />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          {task.estimated_time && (
            <div className='flex items-center space-x-1'>
              <Timer className='h-3 w-3' />
              <span>{task.estimated_time}h</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskForm({
  task,
  onSubmit,
  onCancel,
}: {
  task?: Task;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}) {
  const { language } = useUIStore();
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    estimated_time: task?.estimated_time?.toString() || '',
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

function TaskSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-6 w-3/4' />
            <div className='flex space-x-2'>
              <Skeleton className='h-6 w-16' />
              <Skeleton className='h-6 w-20' />
            </div>
          </div>
          <div className='flex space-x-1'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <div className='flex space-x-4'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const { isAuthenticated, user, isLoading, initialize, isInitialized } =
    useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    }
  }, [isAuthenticated, user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksAPI.getTasks();
      setTasks(response);
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
          ? 'Kunne ikke laste oppgaver'
          : 'Failed to load tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      setActionLoading(true);
      if (!user) {
        setError(language === 'no' ? 'Bruker ikke funnet' : 'User not found');
        setActionLoading(false);
        return;
      }
      await tasksAPI.createTask({
        ...taskData,
        user_id: user.id, // Ensure user_id is included
      });
      await fetchTasks();
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
          ? 'Kunne ikke opprette oppgave'
          : 'Failed to create task'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: TaskFormData) => {
    if (!editingTask) return;

    try {
      setActionLoading(true);
      if (!user) {
        setError(language === 'no' ? 'Bruker ikke funnet' : 'User not found');
        setActionLoading(false);
        return;
      }
      await tasksAPI.updateTask(editingTask.id, {
        ...taskData,
        user_id: user.id,
      });
      await fetchTasks();
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
          ? 'Kunne ikke oppdatere oppgave'
          : 'Failed to update task'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        language === 'no'
          ? 'Er du sikker på at du vil slette denne oppgaven?'
          : 'Are you sure you want to delete this task?'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await tasksAPI.deleteTask(taskId);
      await fetchTasks();
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
          ? 'Kunne ikke slette oppgave'
          : 'Failed to delete task'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(undefined);
  };

  const texts = {
    title: language === 'no' ? 'Oppgaver' : 'Tasks',
    subtitle:
      language === 'no' ? 'Administrer dine oppgaver' : 'Manage your tasks',
    newTask: language === 'no' ? 'Ny Oppgave' : 'New Task',
    noTasks: language === 'no' ? 'Ingen oppgaver ennå' : 'No tasks yet',
    createFirstTask:
      language === 'no'
        ? 'Opprett din første oppgave'
        : 'Create your first task',
    loading: language === 'no' ? 'Laster oppgaver...' : 'Loading tasks...',
    error:
      language === 'no'
        ? 'Feil ved lasting av oppgaver'
        : 'Error loading tasks',
  };
  if (!isInitialized || isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-muted-foreground'>{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>{texts.title}</h1>
              <p className='text-muted-foreground'>{texts.subtitle}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewTask}>
                  <Plus className='mr-2 h-4 w-4' />
                  {texts.newTask}
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                  <DialogTitle>
                    {editingTask
                      ? language === 'no'
                        ? 'Rediger Oppgave'
                        : 'Edit Task'
                      : language === 'no'
                      ? 'Ny Oppgave'
                      : 'New Task'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTask
                      ? language === 'no'
                        ? 'Rediger detaljene for oppgaven'
                        : 'Edit the task details'
                      : language === 'no'
                      ? 'Opprett en ny oppgave'
                      : 'Create a new task'}
                  </DialogDescription>
                </DialogHeader>
                <TaskForm
                  task={editingTask}
                  onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                  onCancel={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert className='mb-6'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tasks Grid */}
          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <TaskSkeleton key={i} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className='text-center py-12'>
              <Target className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h2 className='text-2xl font-semibold mb-2'>{texts.noTasks}</h2>
              <p className='text-muted-foreground mb-6'>
                {texts.createFirstTask}
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewTask}>
                    <Plus className='mr-2 h-4 w-4' />
                    {texts.newTask}
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[500px]'>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'no' ? 'Ny Oppgave' : 'New Task'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'no'
                        ? 'Opprett en ny oppgave'
                        : 'Create a new task'}
                    </DialogDescription>
                  </DialogHeader>
                  <TaskForm
                    onSubmit={handleCreateTask}
                    onCancel={handleCloseDialog}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
