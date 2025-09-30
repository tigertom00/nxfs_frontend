'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskForm } from './task-form';
import { ProjectForm } from './project-form';
import { ProjectManager } from './project-manager';
import { CategoryManager } from './category-manager';
import { useUIStore } from '@/stores';
import {
  Task,
  Category,
  Project,
  CreateTaskPayload,
  CreateProjectPayload,
} from '@/lib/api';
import { CheckSquare, FolderKanban, Settings } from 'lucide-react';

interface CreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  editingProject?: Project;
  categories: Category[];
  projects: Project[];
  userId: number;
  onTaskSubmit: (data: CreateTaskPayload, files?: File[]) => void;
  onTaskCancel: () => void;
  onTaskDelete?: (taskId: string) => void;
  onProjectSubmit?: (data: CreateProjectPayload) => void;
  onProjectsChange: () => void;
  onCategoriesChange: () => void;
}

export function CreationModal({
  isOpen,
  onOpenChange,
  editingTask,
  editingProject,
  categories,
  projects,
  userId,
  onTaskSubmit,
  onTaskCancel,
  onTaskDelete,
  onProjectSubmit,
  onProjectsChange,
  onCategoriesChange,
}: CreationModalProps) {
  const { language } = useUIStore();
  const [activeTab, setActiveTab] = useState(
    editingProject ? 'projects' : 'tasks'
  );

  const texts = {
    tasks: language === 'no' ? 'Oppgaver' : 'Tasks',
    projects: language === 'no' ? 'Prosjekter' : 'Projects',
    settings: language === 'no' ? 'Innstillinger' : 'Settings',
    createTask: language === 'no' ? 'Opprett Oppgave' : 'Create Task',
    editTask: language === 'no' ? 'Rediger Oppgave' : 'Edit Task',
    createProject: language === 'no' ? 'Opprett Prosjekt' : 'Create Project',
    editProject: language === 'no' ? 'Rediger Prosjekt' : 'Edit Project',
    manageCategories:
      language === 'no' ? 'Administrer Kategorier' : 'Manage Categories',
    taskDescription: editingTask
      ? language === 'no'
        ? 'Rediger detaljene for oppgaven'
        : 'Edit the task details'
      : language === 'no'
        ? 'Opprett en ny oppgave'
        : 'Create a new task',
    projectDescription: editingProject
      ? language === 'no'
        ? 'Rediger prosjektdetaljene'
        : 'Edit the project details'
      : language === 'no'
        ? 'Opprett nye prosjekter for å organisere oppgavene dine'
        : 'Create new projects to organize your tasks',
    settingsDescription:
      language === 'no'
        ? 'Administrer kategorier og prosjektinnstillinger'
        : 'Manage categories and project settings',
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleClose = () => {
    onOpenChange(false);
    onTaskCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTask
              ? texts.editTask
              : editingProject
                ? texts.editProject
                : activeTab === 'tasks'
                  ? texts.createTask
                  : activeTab === 'projects'
                    ? texts.createProject
                    : texts.settings}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'tasks'
              ? texts.taskDescription
              : activeTab === 'projects'
                ? texts.projectDescription
                : texts.settingsDescription}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              {texts.tasks}
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              {texts.projects}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {texts.settings}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TaskForm
              task={editingTask}
              categories={categories}
              projects={projects}
              userId={String(userId)}
              onSubmit={onTaskSubmit}
              onCancel={handleClose}
              onDelete={onTaskDelete}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <div className="space-y-6">
              {/* Project Creation Form */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">
                  {editingProject
                    ? language === 'no'
                      ? 'Rediger Prosjekt'
                      : 'Edit Project'
                    : language === 'no'
                      ? 'Opprett Nytt Prosjekt'
                      : 'Create New Project'}
                </h3>
                <ProjectForm
                  project={editingProject}
                  userId={userId}
                  onSubmit={onProjectSubmit || (() => {})}
                  onCancel={handleClose}
                />
              </div>

              {/* Project Manager */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">
                  {language === 'no'
                    ? 'Eksisterende Prosjekter'
                    : 'Existing Projects'}
                </h3>
                <ProjectManager
                  projects={projects}
                  onProjectsChange={onProjectsChange}
                  userId={userId}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">
                  {language === 'no' ? 'Kategorier' : 'Categories'}
                </h3>
                <CategoryManager
                  categories={categories}
                  onCategoriesChange={onCategoriesChange}
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">
                  {language === 'no' ? 'Prosjekter' : 'Projects'}
                </h3>
                <ProjectManager
                  projects={projects}
                  onProjectsChange={onProjectsChange}
                  userId={userId}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
