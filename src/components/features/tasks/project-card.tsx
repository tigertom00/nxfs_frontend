'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui';
import { Project, Task } from '@/lib/api';
import {
  FolderKanban,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Edit3,
  Calendar,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  projectTasks: Task[];
  onEdit: (project: Project) => void;
  onClick: (project: Project) => void;
  onStatusChange: (
    projectId: number,
    newStatus: 'todo' | 'in_progress' | 'completed'
  ) => void;
}

export function ProjectCard({
  project,
  projectTasks,
  onEdit,
  onClick,
  onStatusChange,
}: ProjectCardProps) {
  const { language } = useUIStore();

  const cycleStatus = () => {
    const statusOrder: ('todo' | 'in_progress' | 'completed')[] = [
      'todo',
      'in_progress',
      'completed',
    ];
    const currentIndex = statusOrder.indexOf(project.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    onStatusChange(project.id, nextStatus);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-purple-600" />;
      default:
        return <Circle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
    }
  };

  const getCardBorderStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-4 border-l-green-500';
      case 'in_progress':
        return 'border-l-4 border-l-purple-500';
      default:
        return 'border-l-4 border-l-amber-500';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const texts = {
    tasks: language === 'no' ? 'oppgaver' : 'tasks',
    completed: language === 'no' ? 'fullført' : 'completed',
    inProgress: language === 'no' ? 'pågår' : 'in progress',
    todo: language === 'no' ? 'gjenstår' : 'to do',
    createdOn: language === 'no' ? 'Opprettet' : 'Created',
    progress: language === 'no' ? 'Fremdrift' : 'Progress',
  };

  return (
    <Card
      className={`h-full hover-lift ${getCardBorderStyle(project.status)} ${project.status === 'completed' ? 'opacity-80' : ''}`}
    >
      <CardHeader className="pb-3">
        {/* Status Banner */}
        <div
          className={`flex items-center justify-between p-2 -mx-6 -mt-6 mb-4 rounded-t-lg border-b ${getStatusBadgeStyle(project.status)}`}
        >
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleStatus}
              className="h-auto w-auto p-1 hover:bg-transparent"
              title={
                language === 'no'
                  ? 'Klikk for å endre status'
                  : 'Click to change status'
              }
            >
              {getStatusIcon(project.status)}
            </Button>
            <span className="font-medium text-sm">
              {getStatusText(project.status)}
            </span>
          </div>
          <Badge variant="outline" className="bg-white/50 dark:bg-black/50">
            {taskStats.total} {texts.tasks}
          </Badge>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <FolderKanban className="h-5 w-5 text-purple-600" />
            <CardTitle
              className={`text-lg line-clamp-2 flex-1 ${project.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}
            >
              {language === 'no' && project.name_nb
                ? project.name_nb
                : project.name}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="h-8 w-8 p-0"
              title={language === 'no' ? 'Rediger prosjekt' : 'Edit project'}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClick(project)}
              className="h-8 w-8 p-0"
              title={language === 'no' ? 'Se detaljer' : 'View details'}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0" onClick={() => onClick(project)}>
        {(project.description || project.description_nb) && (
          <CardDescription className="mb-4 line-clamp-2">
            {language === 'no' && project.description_nb
              ? project.description_nb
              : project.description}
          </CardDescription>
        )}

        {/* Progress Bar */}
        {taskStats.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{texts.progress}</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Stats */}
        {taskStats.total > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-secondary/20 rounded">
              <div className="text-lg font-semibold text-green-600">
                {taskStats.completed}
              </div>
              <div className="text-xs text-muted-foreground">
                {texts.completed}
              </div>
            </div>
            <div className="text-center p-2 bg-secondary/20 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {taskStats.inProgress}
              </div>
              <div className="text-xs text-muted-foreground">
                {texts.inProgress}
              </div>
            </div>
            <div className="text-center p-2 bg-secondary/20 rounded">
              <div className="text-lg font-semibold text-gray-600">
                {taskStats.todo}
              </div>
              <div className="text-xs text-muted-foreground">{texts.todo}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>
              {texts.createdOn} {formatDate(project.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
