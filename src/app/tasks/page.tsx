'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  TaskCard,
  TaskForm,
  TaskSkeleton,
  CategoryManager,
  ProjectManager,
  ProjectCard,
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
import { useAuthStore, useUIStore } from '@/stores';
import { tasksAPI, categoriesAPI, projectsAPI } from '@/lib/api';
import { Task, Category, Project } from '@/types/api';
import { TaskFormData } from '@/types/task';
import {
  Plus,
  AlertTriangle,
  Target,
  Loader2,
  EyeOff,
  Eye,
  Filter,
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
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
      fetchCategories();
      fetchProjects();
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
      setProjects(response);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
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

      const payload = { ...taskData, user_id: user.id };
      if (!payload.due_date) {
        delete payload.due_date;
      }
      if (!payload.estimated_time) {
        delete payload.estimated_time;
      }

      await tasksAPI.createTask(payload);
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

      const payload = { ...taskData, user_id: user.id };
      if (!payload.due_date) {
        delete payload.due_date;
      }
      if (!payload.estimated_time) {
        delete payload.estimated_time;
      }

      await tasksAPI.updateTask(editingTask.id, payload);
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
    console.log('Edit project:', project);
    setEditingProject(project);
  };

  const handleEditComplete = () => {
    setEditingProject(null);
    fetchProjects(); // Refresh projects after edit
  };

  // Sort standalone tasks: incomplete tasks first, then completed tasks
  const sortedStandaloneTasks = [...standaloneTasks].sort((a, b) => {
    // Completed tasks go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // For tasks of same completion status, sort by priority
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Sort projects by status and creation date
  const sortedProjects = [...projects].sort((a, b) => {
    // Completed projects go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // Sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{texts.title}</h1>
              <p className="text-muted-foreground">{texts.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectManager
                projects={projects}
                onProjectsChange={fetchProjects}
                userId={Number(user.id)}
                editProject={editingProject || undefined}
                onEditComplete={handleEditComplete}
              />

              <CategoryManager
                categories={categories}
                onCategoriesChange={fetchCategories}
              />

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    {texts.newTask}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
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
                    categories={categories}
                    projects={projects}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    onCancel={handleCloseDialog}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          {(projects.length > 0 || categories.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {(selectedCategories.length > 0 ||
                  selectedProject !== null) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    {texts.clearAllFilters}
                  </Button>
                )}
              </div>

              {/* Project Filter */}
              {projects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {texts.filterByProject}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedProject === null ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => setSelectedProject(null)}
                    >
                      {texts.allProjects}
                    </Badge>
                    <Badge
                      variant={selectedProject === 0 ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => setSelectedProject(0)}
                    >
                      {texts.noProject}
                    </Badge>
                    {projects.map((project) => {
                      const isSelected = selectedProject === project.id;
                      return (
                        <Badge
                          key={project.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-primary/20"
                          onClick={() =>
                            setSelectedProject(isSelected ? null : project.id)
                          }
                        >
                          {language === 'no' && project.name_nb
                            ? project.name_nb
                            : project.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {texts.filterByCategory}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(
                        category.id
                      );
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
                  </div>
                  {selectedCategories.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCategories.length} {texts.categoriesSelected}
                    </p>
                  )}
                </div>
              )}
            </div>
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    {texts.newTask}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
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
                    categories={categories}
                    projects={projects}
                    onSubmit={handleCreateTask}
                    onCancel={handleCloseDialog}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-8">
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
                      />
                    ))}
                  </div>
                </div>
              )}

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
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
