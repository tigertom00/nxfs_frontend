'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUIStore } from '@/stores/ui';
import { Project } from '@/types/api';
import { ProjectFormData } from '@/types/task';
import { projectsAPI } from '@/lib/api';
import {
  Plus,
  Edit3,
  Trash2,
  FolderKanban,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  onProjectsChange: () => void;
  userId: number;
  editProject?: Project; // Optional project to edit
  onEditComplete?: () => void; // Callback when edit is complete
}

export function ProjectManager({
  projects,
  onProjectsChange,
  userId,
  editProject,
  onEditComplete,
}: ProjectManagerProps) {
  const { language } = useUIStore();
  const [isDialogOpen, setIsDialogOpen] = useState(!!editProject);
  const [editingProject, setEditingProject] = useState<Project | undefined>(
    editProject
  );
  const [showForm, setShowForm] = useState(!!editProject);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: editProject?.name || '',
    name_nb: editProject?.name_nb || '',
    description: editProject?.description || '',
    description_nb: editProject?.description_nb || '',
    status: editProject?.status || 'todo',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle external edit project
  useEffect(() => {
    if (editProject) {
      setEditingProject(editProject);
      setFormData({
        name: editProject.name,
        name_nb: editProject.name_nb || '',
        description: editProject.description || '',
        description_nb: editProject.description_nb || '',
        status: editProject.status,
      });
      setShowForm(true);
      setIsDialogOpen(true);
    }
  }, [editProject]);

  const texts = {
    manageProjects:
      language === 'no' ? 'Administrer Prosjekter' : 'Manage Projects',
    newProject: language === 'no' ? 'Nytt Prosjekt' : 'New Project',
    editProject: language === 'no' ? 'Rediger Prosjekt' : 'Edit Project',
    projectName: language === 'no' ? 'Prosjektnavn' : 'Project Name',
    projectNameNorwegian:
      language === 'no' ? 'Prosjektnavn (Norsk)' : 'Project Name (Norwegian)',
    description: language === 'no' ? 'Beskrivelse' : 'Description',
    descriptionNorwegian:
      language === 'no' ? 'Beskrivelse (Norsk)' : 'Description (Norwegian)',
    status: language === 'no' ? 'Status' : 'Status',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    delete: language === 'no' ? 'Slett' : 'Delete',
    deleteConfirm:
      language === 'no'
        ? 'Er du sikker på at du vil slette dette prosjektet?'
        : 'Are you sure you want to delete this project?',
    deleteDescription:
      language === 'no'
        ? 'Denne handlingen kan ikke angres. Oppgaver i prosjektet blir ikke slettet.'
        : 'This action cannot be undone. Tasks in this project will not be deleted.',
    noProjects: language === 'no' ? 'Ingen prosjekter ennå' : 'No projects yet',
    createFirst:
      language === 'no'
        ? 'Opprett ditt første prosjekt'
        : 'Create your first project',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
    todo: language === 'no' ? 'To Do' : 'To Do',
    inProgress: language === 'no' ? 'Pågår' : 'In Progress',
    completed: language === 'no' ? 'Fullført' : 'Completed',
    tasksCount: language === 'no' ? 'oppgaver' : 'tasks',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Map status to Norwegian equivalent
      const statusMapping = {
        todo: 'å gjøre' as const,
        in_progress: 'pågående' as const,
        completed: 'fullført' as const,
      };

      const projectData: any = {
        name: formData.name.trim(),
        status: formData.status,
        status_nb: statusMapping[formData.status as keyof typeof statusMapping],
        user_id: userId,
        ...(formData.name_nb?.trim() && { name_nb: formData.name_nb.trim() }),
        ...(formData.description?.trim() && {
          description: formData.description.trim(),
        }),
        ...(formData.description_nb?.trim() && {
          description_nb: formData.description_nb.trim(),
        }),
      };

      if (editingProject) {
        await projectsAPI.updateProject(
          editingProject.id.toString(),
          projectData as Partial<Project>
        );
      } else {
        await projectsAPI.createProject(projectData as Partial<Project>);
      }

      onProjectsChange();
      setShowForm(false);
      setFormData({
        name: '',
        name_nb: '',
        description: '',
        description_nb: '',
        status: 'todo',
      });
      setEditingProject(undefined);

      // Call completion callback if provided
      if (onEditComplete) {
        onEditComplete();
      }
    } catch (err: any) {
      console.error('Project operation failed:', err);
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    setLoading(true);
    try {
      await projectsAPI.deleteProject(projectId.toString());
      onProjectsChange();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      name_nb: project.name_nb || '',
      description: project.description || '',
      description_nb: project.description_nb || '',
      status: project.status,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingProject(undefined);
    setFormData({
      name: '',
      name_nb: '',
      description: '',
      description_nb: '',
      status: 'todo',
    });
    setShowForm(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(undefined);
    setShowForm(false);
    setFormData({
      name: '',
      name_nb: '',
      description: '',
      description_nb: '',
      status: 'todo',
    });
    setError(null);

    // Call completion callback if provided (for external edits)
    if (onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderKanban className="mr-2 h-4 w-4" />
          {texts.manageProjects}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{texts.manageProjects}</DialogTitle>
          <DialogDescription>
            {language === 'no'
              ? 'Opprett, rediger eller slett prosjekter for å organisere oppgavene dine.'
              : 'Create, edit, or delete projects to organize your tasks.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {language === 'no'
                  ? 'Eksisterende Prosjekter'
                  : 'Existing Projects'}
              </h4>
              <Button onClick={handleNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {texts.newProject}
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{texts.noProjects}</p>
                <p className="text-xs">{texts.createFirst}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <span className="font-medium">
                          {language === 'no' && project.name_nb
                            ? project.name_nb
                            : project.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {language === 'no' && project.description_nb
                            ? project.description_nb
                            : project.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {project.tasks?.length || 0} {texts.tasksCount}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(project)}
                        disabled={loading}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loading}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {texts.deleteConfirm}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {texts.deleteDescription}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {texts.cancel}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(project.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {texts.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">
                {editingProject ? texts.editProject : texts.newProject}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">{texts.projectName}</Label>
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
                    value={formData.name_nb}
                    onChange={(e) =>
                      setFormData({ ...formData, name_nb: e.target.value })
                    }
                    disabled={loading}
                    placeholder="Nettside Redesign, Mobil App, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-status">{texts.status}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: 'todo' | 'in_progress' | 'completed'
                  ) => setFormData({ ...formData, status: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{texts.todo}</SelectItem>
                    <SelectItem value="in_progress">
                      {texts.inProgress}
                    </SelectItem>
                    <SelectItem value="completed">{texts.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">{texts.description}</Label>
                <Textarea
                  id="project-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={loading}
                  rows={2}
                  placeholder="Brief description of the project..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description-nb">
                  {texts.descriptionNorwegian}
                </Label>
                <Textarea
                  id="project-description-nb"
                  value={formData.description_nb}
                  onChange={(e) =>
                    setFormData({ ...formData, description_nb: e.target.value })
                  }
                  disabled={loading}
                  rows={2}
                  placeholder="Kort beskrivelse av prosjektet..."
                />
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={loading}
                >
                  {texts.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {texts.saving}
                    </>
                  ) : (
                    texts.save
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
