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
import { Project, Task } from '@/types/api';
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
}

export function ProjectCard({
  project,
  projectTasks,
  onEdit,
  onClick,
}: ProjectCardProps) {
  const { language } = useUIStore();

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
    viewDetails: language === 'no' ? 'Se detaljer' : 'View details',
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <FolderKanban className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {language === 'no' && project.name_nb
                  ? project.name_nb
                  : project.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
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
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClick(project)}
              className="h-8 w-8 p-0"
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>
              {texts.createdOn} {formatDate(project.created_at)}
            </span>
          </div>
          <span className="text-primary font-medium group-hover:underline">
            {texts.viewDetails}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
