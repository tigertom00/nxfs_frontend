'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  TaskCard,
  TaskSkeleton,
  ProjectCard,
  CreationModal,
  ProjectManager,
} from '@/components/features/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore, useUIStore } from '@/stores';
import {
  tasksAPI,
  categoriesAPI,
  projectsAPI,
  Task,
  Category,
  Project,
  CreateTaskPayload,
  CreateProjectPayload,
} from '@/lib/api';
import {
  Plus,
  AlertTriangle,
  Target,
  Loader2,
  EyeOff,
  Eye,
  X,
  FolderKanban,
} from 'lucide-react';

export default function TasksPage() {
  const { isAuthenticated, user, isLoading, initialize, isInitialized } =
    useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    ('todo' | 'in_progress' | 'completed')[]
  >([]);
  const [selectedPriority, setSelectedPriority] = useState<
    ('low' | 'medium' | 'high')[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
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
    if (isAuthenticated && user) {
      fetchTasks();
      fetchCategories();
      fetchProjects();
    }
  }, [isAuthenticated, user]);

  // Refetch tasks when filters change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    }
  }, [
    selectedCategories,
    selectedProject,
    selectedStatus,
    selectedPriority,
    searchQuery,
    dateRange,
  ]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters using enhanced filtering
      const queryParams: any = {};

      if (selectedCategories.length > 0) {
        queryParams.category = selectedCategories;
      }

      if (selectedProject) {
        queryParams.project = selectedProject;
      }

      if (selectedStatus.length > 0) {
        queryParams.status = selectedStatus;
      }

      if (selectedPriority.length > 0) {
        queryParams.priority = selectedPriority;
      }

      if (searchQuery.trim()) {
        queryParams.search = searchQuery.trim();
      }

      if (dateRange.start) {
        queryParams.due_date_start = dateRange.start;
      }

      if (dateRange.end) {
        queryParams.due_date_end = dateRange.end;
      }

      const response = await tasksAPI.getTasks(queryParams);

      // Handle the enhanced response format
      let tasksArray: Task[] = [];
      if (Array.isArray(response)) {
        tasksArray = response;
      } else if (response.results) {
        tasksArray = response.results;
      } else if ((response as any).filters_applied) {
        // Handle TasksFilterResponse format
        tasksArray = (response as any).results || [];
      }

      setTasks(tasksArray);
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

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      // Extract array from potentially paginated response
      const projectsArray = Array.isArray(response)
        ? response
        : response.results || [];
      setProjects(projectsArray);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleCreateTask = async (
    taskData: CreateTaskPayload,
    files?: File[]
  ) => {
    try {
      setActionLoading(true);
      if (!user) {
        setError(language === 'no' ? 'Bruker ikke funnet' : 'User not found');
        setActionLoading(false);
        return;
      }

      const payload = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date || undefined,
        estimated_time: taskData.estimated_time || undefined,
        category: taskData.category || [],
        project: taskData.project || undefined,
        user_id: parseInt(user.id), // Convert string to number for API
      };

      // Remove undefined fields to avoid sending them
      if (!payload.due_date) {
        delete payload.due_date;
      }
      if (!payload.estimated_time) {
        delete payload.estimated_time;
      }

      // Create the task first
      const createdTask = await tasksAPI.createTask(payload);

      // Upload images if any
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await tasksAPI.uploadImage(createdTask.id, file);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            // Continue with other images even if one fails
          }
        }
      }

      await fetchTasks();
      setIsDialogOpen(false);
      setEditingTask(undefined);
    } catch (err: any) {
      console.error('Task creation error:', err);
      console.error('Task creation error response:', err.response?.data);

      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      const errorText = errorMessages.length > 0
        ? errorMessages.join('\n')
        : err.message || (language === 'no'
          ? 'Kunne ikke opprette oppgave'
          : 'Failed to create task');

      setError(errorText);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async (
    taskData: CreateTaskPayload,
    files?: File[]
  ) => {
    if (!editingTask) return;

    try {
      setActionLoading(true);
      if (!user) {
        setError(language === 'no' ? 'Bruker ikke funnet' : 'User not found');
        setActionLoading(false);
        return;
      }

      const payload = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date || undefined,
        estimated_time: taskData.estimated_time || undefined,
        category: taskData.category || [],
        project: taskData.project || undefined,
        user_id: user.id,
      };

      // Remove undefined fields to avoid sending them
      if (!payload.due_date) {
        delete payload.due_date;
      }
      if (!payload.estimated_time) {
        delete payload.estimated_time;
      }

      // Update the task first
      await tasksAPI.updateTask(editingTask.id, payload);

      // Upload new images if any
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await tasksAPI.uploadImage(editingTask.id, file);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            // Continue with other images even if one fails
          }
        }
      }

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

  const handleCreateProject = async (projectData: CreateProjectPayload) => {
    try {
      setActionLoading(true);
      if (!user) {
        setError(language === 'no' ? 'Bruker ikke funnet' : 'User not found');
        setActionLoading(false);
        return;
      }

      // Map status to Norwegian equivalent
      const statusMapping = {
        todo: 'å gjøre' as const,
        in_progress: 'pågående' as const,
        completed: 'fullført' as const,
      };

      const payload: any = {
        name: projectData.name.trim(),
        status: projectData.status,
        status_nb:
          statusMapping[projectData.status as keyof typeof statusMapping],
        user_id: parseInt(user.id),
        ...(projectData.name_nb?.trim() && {
          name_nb: projectData.name_nb.trim(),
        }),
        ...(projectData.description?.trim() && {
          description: projectData.description.trim(),
        }),
        ...(projectData.description_nb?.trim() && {
          description_nb: projectData.description_nb.trim(),
        }),
      };

      await projectsAPI.createProject(payload);
      await fetchProjects();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
            ? 'Kunne ikke opprette prosjekt'
            : 'Failed to create project'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProject = async (projectData: CreateProjectPayload) => {
    try {
      setActionLoading(true);
      if (!user || !editingProject) {
        setError(
          language === 'no'
            ? 'Bruker eller prosjekt ikke funnet'
            : 'User or project not found'
        );
        setActionLoading(false);
        return;
      }

      // Map status to Norwegian equivalent
      const statusMapping = {
        todo: 'å gjøre' as const,
        in_progress: 'pågående' as const,
        completed: 'fullført' as const,
      };

      const payload: any = {
        name: projectData.name.trim(),
        status: projectData.status,
        status_nb:
          statusMapping[projectData.status as keyof typeof statusMapping],
        completed: projectData.status === 'completed',
        ...(projectData.status === 'completed' && {
          completed_at: new Date().toISOString(),
        }),
        ...(projectData.name_nb?.trim() && {
          name_nb: projectData.name_nb.trim(),
        }),
        ...(projectData.description?.trim() && {
          description: projectData.description.trim(),
        }),
        ...(projectData.description_nb?.trim() && {
          description_nb: projectData.description_nb.trim(),
        }),
      };

      await projectsAPI.updateProject(editingProject.id.toString(), payload);
      await fetchProjects();
      setIsDialogOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      console.log(err.response?.data);
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
            ? 'Kunne ikke oppdatere prosjekt'
            : 'Failed to update project'
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
      await fetchTasks();
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
      await fetchTasks();
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

  const handleProjectStatusChange = async (
    projectId: number,
    newStatus: 'todo' | 'in_progress' | 'completed'
  ) => {
    try {
      setActionLoading(true);
      const project = projects.find((p) => p.id === projectId);
      if (!project || !user) return;

      // Map status to Norwegian equivalent
      const statusMapping = {
        todo: 'å gjøre' as const,
        in_progress: 'pågående' as const,
        completed: 'fullført' as const,
      };

      const payload: any = {
        name: project.name.trim(),
        status: newStatus,
        status_nb: statusMapping[newStatus as keyof typeof statusMapping],
        user_id: parseInt(user.id),
        ...(project.name_nb?.trim() && { name_nb: project.name_nb.trim() }),
        ...(project.description?.trim() && {
          description: project.description.trim(),
        }),
        ...(project.description_nb?.trim() && {
          description_nb: project.description_nb.trim(),
        }),
      };

      await projectsAPI.updateProject(projectId.toString(), payload);
      await fetchProjects();
    } catch (error) {
      setError(
        language === 'no'
          ? 'Kunne ikke oppdatere prosjektstatus'
          : 'Failed to update project status'
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
    setEditingProject(null);
  };

  // Filter tasks - show only standalone tasks (no project assigned) on main page
  const standaloneTasks = tasks.filter((task) => {
    // Only show tasks without a project (or project = null/undefined)
    if (task.project) return false;

    // Filter by completion status
    if (!showCompleted && task.status === 'completed') return false;

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      return (
        task.category &&
        task.category.some((catId) => selectedCategories.includes(catId))
      );
    }

    return true;
  });

  // Filter projects by completion status
  const filteredProjects = projects.filter((project) => {
    if (!showCompleted && project.status === 'completed') return false;
    return true;
  });

  // Get tasks for a specific project
  const getProjectTasks = (projectId: number) => {
    return tasks.filter((task) => task.project === projectId);
  };

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearCategoryFilters = () => {
    setSelectedCategories([]);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedProject(null);
  };

  const handleProjectClick = (project: Project) => {
    console.log('Project clicked:', project);
    router.push(`/tasks/project/${project.id}`);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    // Don't open isDialogOpen since ProjectManager handles its own dialog
  };

  const handleEditComplete = () => {
    setEditingProject(null);
    fetchProjects(); // Refresh projects after edit
  };

  // Sort standalone tasks: Priority → Status → Date → Title
  const sortedStandaloneTasks = [...standaloneTasks].sort((a, b) => {
    // 1. Sort by priority (high → medium → low)
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Sort by status (in_progress → todo → completed)
    const statusOrder: Record<'in_progress' | 'todo' | 'completed', number> = {
      in_progress: 3,
      todo: 2,
      completed: 1,
    };
    const statusDiff = statusOrder[b.status] - statusOrder[a.status];
    if (statusDiff !== 0) return statusDiff;

    // 3. Sort by updated date (newest first)
    const dateA = new Date(a.updated_at);
    const dateB = new Date(b.updated_at);
    const dateDiff = dateB.getTime() - dateA.getTime();
    if (dateDiff !== 0) return dateDiff;

    // 4. Sort by title alphabetically
    return a.title.localeCompare(b.title);
  });

  // Sort projects: Status → Date → Name
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // 1. Sort by status (in_progress → todo → completed)
    const statusOrder: Record<'in_progress' | 'todo' | 'completed', number> = {
      in_progress: 3,
      todo: 2,
      completed: 1,
    };
    const statusDiff = statusOrder[b.status] - statusOrder[a.status];
    if (statusDiff !== 0) return statusDiff;

    // 2. Sort by updated date (newest first)
    const dateA = new Date(a.updated_at);
    const dateB = new Date(b.updated_at);
    const dateDiff = dateB.getTime() - dateA.getTime();
    if (dateDiff !== 0) return dateDiff;

    // 3. Sort by name alphabetically
    return a.name.localeCompare(b.name);
  });

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
    showCompleted: language === 'no' ? 'Vis fullførte' : 'Show completed',
    hideCompleted: language === 'no' ? 'Skjul fullførte' : 'Hide completed',
    filterByCategory:
      language === 'no' ? 'Filtrer etter kategori' : 'Filter by category',
    filterByProject:
      language === 'no' ? 'Filtrer etter prosjekt' : 'Filter by project',
    clearFilters: language === 'no' ? 'Fjern filtre' : 'Clear filters',
    clearAllFilters:
      language === 'no' ? 'Fjern alle filtre' : 'Clear all filters',
    categoriesSelected:
      language === 'no' ? 'kategorier valgt' : 'categories selected',
    allProjects: language === 'no' ? 'Alle prosjekter' : 'All projects',
    noProject: language === 'no' ? 'Uten prosjekt' : 'No project',
    projects: language === 'no' ? 'Prosjekter' : 'Projects',
    standaloneTasks: language === 'no' ? 'Løse Oppgaver' : 'Standalone Tasks',
  };

  if (!isInitialized || isLoading) {
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
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Filters */}
          {categories.length > 0 ? (
            <div className="flex flex-col items-end gap-2 mb-6">
              <span className="text-sm font-medium text-muted-foreground">
                {texts.filterByCategory}:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <Badge
                      key={category.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => toggleCategoryFilter(category.id)}
                    >
                      {language === 'no' && category.name_nb
                        ? category.name_nb
                        : category.name}
                    </Badge>
                  );
                })}
                {selectedCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCategoryFilters}
                    className="text-muted-foreground hover:text-foreground ml-2"
                  >
                    <X className="mr-1 h-3 w-3" />
                    {texts.clearFilters}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6"></div>
          )}

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
          ) : sortedProjects.length === 0 &&
            sortedStandaloneTasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{texts.noTasks}</h2>
              <p className="text-muted-foreground mb-6">
                {texts.createFirstTask}
              </p>
              <Button onClick={handleNewTask}>
                <Plus className="mr-2 h-4 w-4" />
                {texts.newTask}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Standalone Tasks Section */}
              {sortedStandaloneTasks.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {texts.standaloneTasks}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedStandaloneTasks.map((task) => (
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
                </div>
              )}

              {/* Projects Section */}
              {sortedProjects.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    {texts.projects}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        projectTasks={getProjectTasks(project.id)}
                        onEdit={handleEditProject}
                        onClick={handleProjectClick}
                        onStatusChange={handleProjectStatusChange}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show/Hide Completed Button */}
              {(sortedStandaloneTasks.length > 0 ||
                sortedProjects.length > 0) && (
                <div className="flex justify-center pt-4">
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
              )}
            </div>
          )}
        </div>
      </main>
      <ChatBot />

      {/* Creation Modal */}
      <CreationModal
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTask={editingTask}
        categories={categories}
        projects={projects}
        userId={parseInt(user.id)}
        onTaskSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        onTaskCancel={handleCloseDialog}
        onTaskDelete={handleDeleteTask}
        onProjectSubmit={handleCreateProject}
        onProjectsChange={fetchProjects}
        onCategoriesChange={fetchCategories}
      />

      {/* Project Edit Manager */}
      {editingProject && (
        <ProjectManager
          projects={projects}
          onProjectsChange={fetchProjects}
          userId={parseInt(user.id)}
          editProject={editingProject}
          onEditComplete={() => {
            setEditingProject(null);
            setIsDialogOpen(false);
          }}
        />
      )}

      {/* Floating New Task Button */}
      <Button
        onClick={handleNewTask}
        size="lg"
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        aria-label={texts.newTask}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
