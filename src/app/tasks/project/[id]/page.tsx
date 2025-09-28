'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  TaskCard,
  TaskForm,
  TaskSkeleton,
  ProjectManager,
} from '@/components/features/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { tasksAPI, categoriesAPI, projectsAPI, Task, Category, Project } from '@/lib/api';
import { CreateTaskPayload as TaskFormData } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  Target,
  Loader2,
  EyeOff,
  Eye,
  FolderKanban,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Edit3,
  Users,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { isAuthenticated, user, isLoading, initialize, isInitialized } =
    useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isAuthenticated && user && projectId) {
      fetchProjectData();
    }
  }, [isAuthenticated, user, projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project, tasks, and categories in parallel
      const [
        projectResponse,
        tasksResponse,
        categoriesResponse,
        projectsResponse,
      ] = await Promise.all([
        projectsAPI.getProject(projectId),
        tasksAPI.getTasks(),
        categoriesAPI.getCategories(),
        projectsAPI.getProjects(),
      ]);

      setProject(projectResponse);
      // Extract arrays from potentially paginated responses
      const tasksArray = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse as any).results || [];
      const projectsArray = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse as any).results || [];
      const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any).results || [];

      setTasks(tasksArray);
      setCategories(categoriesArray);
      setProjects(projectsArray);
    } catch (err: any) {
      console.error('Failed to load project data:', err);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
            ? 'Kunne ikke laste prosjektdata'
            : 'Failed to load project data'
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
        return;
      }

      const payload = {
        ...taskData,
        user_id: user.id,
        project: parseInt(projectId), // Assign to current project
      };

      if (!payload.due_date) delete payload.due_date;
      if (!payload.estimated_time) delete payload.estimated_time;

      await tasksAPI.createTask(payload);
      await fetchProjectData();
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (err: any) {
      console.error('Task creation failed:', err);
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
        return;
      }

      const payload = { ...taskData, user_id: user.id };
      if (!payload.due_date) delete payload.due_date;
      if (!payload.estimated_time) delete payload.estimated_time;

      await tasksAPI.updateTask(editingTask.id, payload);
      await fetchProjectData();
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (err: any) {
      console.error('Task update failed:', err);
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
      await fetchProjectData();
    } catch (err: any) {
      console.error('Task deletion failed:', err);
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

  const handleStatusChange = async (
    taskId: string,
    newStatus: 'todo' | 'in_progress' | 'completed'
  ) => {
    try {
      setActionLoading(true);
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !user) return;

      const payload = {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        due_date: task.due_date || undefined,
        estimated_time: task.estimated_time?.toString() || undefined,
        category: task.category,
        project: task.project || undefined,
        user_id: user.id,
      };

      await tasksAPI.updateTask(taskId, payload);
      const updatedTasks = await tasksAPI.getTasks();
      const updatedTasksArray = Array.isArray(updatedTasks) ? updatedTasks : updatedTasks.results || [];
      setTasks(updatedTasksArray);
    } catch (error) {
      setError(
        language === 'no'
          ? 'Kunne ikke oppdatere oppgavestatus'
          : 'Failed to update task status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (
    taskId: string,
    newPriority: 'low' | 'medium' | 'high'
  ) => {
    try {
      setActionLoading(true);
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !user) return;

      const payload = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: newPriority,
        due_date: task.due_date || undefined,
        estimated_time: task.estimated_time?.toString() || undefined,
        category: task.category,
        project: task.project || undefined,
        user_id: user.id,
      };

      await tasksAPI.updateTask(taskId, payload);
      const updatedTasks = await tasksAPI.getTasks();
      const updatedTasksArray = Array.isArray(updatedTasks) ? updatedTasks : updatedTasks.results || [];
      setTasks(updatedTasksArray);
    } catch (error) {
      setError(
        language === 'no'
          ? 'Kunne ikke oppdatere oppgaveprioritet'
          : 'Failed to update task priority'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(undefined);
  };

  const handleEditProject = () => {
    setEditingProject(project);
  };

  const handleEditComplete = () => {
    setEditingProject(null);
    fetchProjectData();
  };

  // Filter tasks for this project
  const projectTasks = tasks.filter(
    (task) => task.project === parseInt(projectId)
  );

  // Filter by completion status
  const filteredTasks = projectTasks.filter(
    (task) => showCompleted || task.status !== 'completed'
  );

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    const priorityOrder: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const taskStats = {
    total: projectTasks.length,
    completed: projectTasks.filter((task) => task.status === 'completed')
      .length,
    inProgress: projectTasks.filter((task) => task.status === 'in_progress')
      .length,
    todo: projectTasks.filter((task) => task.status === 'todo').length,
  };

  const completionPercentage =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  const texts = {
    backToTasks: language === 'no' ? 'Tilbake til oppgaver' : 'Back to tasks',
    newTask: language === 'no' ? 'Ny oppgave' : 'New task',
    editProject: language === 'no' ? 'Rediger prosjekt' : 'Edit project',
    noTasks:
      language === 'no'
        ? 'Ingen oppgaver i dette prosjektet'
        : 'No tasks in this project',
    createFirstTask:
      language === 'no'
        ? 'Opprett din første oppgave for dette prosjektet'
        : 'Create your first task for this project',
    showCompleted: language === 'no' ? 'Vis fullførte' : 'Show completed',
    hideCompleted: language === 'no' ? 'Skjul fullførte' : 'Hide completed',
    tasks: language === 'no' ? 'oppgaver' : 'tasks',
    completed: language === 'no' ? 'fullført' : 'completed',
    inProgress: language === 'no' ? 'pågår' : 'in progress',
    todo: language === 'no' ? 'gjenstår' : 'to do',
    progress: language === 'no' ? 'Fremdrift' : 'Progress',
    createdOn: language === 'no' ? 'Opprettet' : 'Created',
    loading: language === 'no' ? 'Laster...' : 'Loading...',
  };

  if (!isInitialized || isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                {language === 'no'
                  ? 'Prosjekt ikke funnet'
                  : 'Project not found'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'no'
                  ? 'Prosjektet du leter etter eksisterer ikke eller du har ikke tilgang til det.'
                  : 'The project you are looking for does not exist or you do not have access to it.'}
              </p>
              <Button onClick={() => router.push('/tasks')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {texts.backToTasks}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/tasks')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {texts.backToTasks}
              </Button>
            </div>

            {/* Project Info Card */}
            <div className="bg-card border rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {language === 'no' && project.name_nb
                        ? project.name_nb
                        : project.name}
                    </h1>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(project.status)}
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </Badge>
                      <Badge variant="outline">
                        {taskStats.total} {texts.tasks}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProject}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    {texts.editProject}
                  </Button>
                  <Button onClick={handleNewTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    {texts.newTask}
                  </Button>
                </div>
              </div>

              {(project.description || project.description_nb) && (
                <p className="text-muted-foreground mb-4">
                  {language === 'no' && project.description_nb
                    ? project.description_nb
                    : project.description}
                </p>
              )}

              {/* Progress and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Bar */}
                {taskStats.total > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">{texts.progress}</span>
                      <span className="font-semibold">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 mb-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Task Stats */}
                {taskStats.total > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {taskStats.completed}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {texts.completed}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {taskStats.inProgress}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {texts.inProgress}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {taskStats.todo}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {texts.todo}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Meta */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {texts.createdOn} {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {language === 'no' ? 'Oppgaver' : 'Tasks'}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      {texts.hideCompleted}
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      {texts.showCompleted}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tasks Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <TaskSkeleton key={i} />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{texts.noTasks}</h3>
              <p className="text-muted-foreground mb-6">
                {texts.createFirstTask}
              </p>
              <Button onClick={handleNewTask}>
                <Plus className="mr-2 h-4 w-4" />
                {texts.newTask}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  categories={categories}
                  projects={projects}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                />
              ))}
            </div>
          )}

          {/* Task Form Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTask
                    ? language === 'no'
                      ? 'Rediger oppgave'
                      : 'Edit task'
                    : language === 'no'
                      ? 'Ny oppgave'
                      : 'New task'}
                </DialogTitle>
                <DialogDescription>
                  {editingTask
                    ? language === 'no'
                      ? 'Rediger detaljene for oppgaven'
                      : 'Edit the task details'
                    : language === 'no'
                      ? 'Opprett en ny oppgave for dette prosjektet'
                      : 'Create a new task for this project'}
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                task={editingTask}
                categories={categories}
                projects={projects}
                userId={user.id}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>

          {/* Project Edit Manager */}
          {editingProject && (
            <ProjectManager
              projects={projects}
              onProjectsChange={fetchProjectData}
              userId={Number(user.id)}
              editProject={editingProject}
              onEditComplete={handleEditComplete}
            />
          )}
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
