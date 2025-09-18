'use client';

import React, { useState } from 'react';
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
import { Task, Category, Project } from '@/types/task';
import { ImageViewer } from './image-viewer';
import {
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Timer,
  Tag,
  FolderKanban,
  ImageIcon,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  categories: Category[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({
  task,
  categories,
  projects,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const { language } = useUIStore();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

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
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {getStatusIcon(task.status)}
            <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {task.images && task.images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImageViewerOpen(true)}
                className="h-8 w-8 p-0 relative"
                title={`${language === 'no' ? 'Se bilder' : 'View images'} (${task.images.length})`}
              >
                <ImageIcon className="h-4 w-4" />
                {task.images.length > 1 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center rounded-full"
                  >
                    {task.images.length}
                  </Badge>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getPriorityColor(task.priority)}>
            {getPriorityText(task.priority)}
          </Badge>
          <Badge variant="outline">{getStatusText(task.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <CardDescription className="mb-4 line-clamp-3">
            {task.description}
          </CardDescription>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          {task.due_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          {task.estimated_time && (
            <div className="flex items-center space-x-1">
              <Timer className="h-3 w-3" />
              <span>{task.estimated_time}h</span>
            </div>
          )}
          {task.project && (
            <div className="flex items-center space-x-1">
              <FolderKanban className="h-3 w-3" />
              <span className="text-xs">
                {(() => {
                  const project = projects.find((p) => p.id === task.project);
                  return project
                    ? language === 'no' && project.name_nb
                      ? project.name_nb
                      : project.name
                    : 'Unknown Project';
                })()}
              </span>
            </div>
          )}
          {task.category && task.category.length > 0 && (
            <div className="flex items-center space-x-1 flex-wrap">
              <Tag className="h-3 w-3" />
              <div className="flex flex-wrap gap-1">
                {task.category.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  if (!category) return null;
                  return (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="text-xs px-1 py-0"
                    >
                      {language === 'no' && category.name_nb
                        ? category.name_nb
                        : category.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          {task.images && task.images.length > 0 && (
            <div className="flex items-center space-x-1">
              <ImageIcon className="h-3 w-3" />
              <span className="text-xs">
                {task.images.length} {language === 'no' ? 'bilde(r)' : 'image(s)'}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Image Viewer Modal */}
      {task.images && task.images.length > 0 && (
        <ImageViewer
          isOpen={isImageViewerOpen}
          onOpenChange={setIsImageViewerOpen}
          images={task.images}
          taskTitle={task.title}
        />
      )}
    </Card>
  );
}
