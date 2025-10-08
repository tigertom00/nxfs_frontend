'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { jobberTasksAPI, JobberTask } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useIntl } from '@/hooks/use-intl';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Image as ImageIcon,
  Plus,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

interface JobberTaskCardProps {
  jobId: number;
  ordreNr: string;
}

export function JobberTaskCard({ jobId, ordreNr }: JobberTaskCardProps) {
  const { toast } = useToast();
  const { t } = useIntl();
  const [tasks, setTasks] = useState<JobberTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Add task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskImage, setNewTaskImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState<JobberTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);

  // Confirmation dialogs
  const [taskToComplete, setTaskToComplete] = useState<JobberTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<JobberTask | null>(null);

  // Image lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, [jobId, refreshTrigger]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await jobberTasksAPI.getTasksByJob(jobId);
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast({
        title: t('common.error'),
        description: t('memo.tasks.taskTitleRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await jobberTasksAPI.createTask({
        title: newTaskTitle,
        notes: newTaskNotes || undefined,
        jobb: jobId,
        image: newTaskImage || undefined,
      });

      // Reset form
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskImage(null);
      setRefreshTrigger((prev) => prev + 1);
      setActiveTab('tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: JobberTask) => {
    try {
      await jobberTasksAPI.toggleComplete(task.id);
      setRefreshTrigger((prev) => prev + 1);
      setTaskToComplete(null);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editTitle.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await jobberTasksAPI.patchTask(editingTask.id, {
        title: editTitle,
        notes: editNotes || undefined,
        image: editImage || undefined,
      });

      setEditingTask(null);
      setEditTitle('');
      setEditNotes('');
      setEditImage(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (task: JobberTask) => {
    try {
      await jobberTasksAPI.deleteTask(task.id);
      setRefreshTrigger((prev) => prev + 1);
      setTaskToDelete(null);
      setExpandedTaskId(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openEditDialog = (task: JobberTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditImage(null);
  };

  const openImageLightbox = (imageUrl: string) => {
    // Fix HTTP URLs to HTTPS for proper loading
    const httpsUrl = imageUrl.replace('http://', 'https://');
    setLightboxImage(httpsUrl);
    setLightboxOpen(true);
  };

  // Filter tasks
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => !task.completed);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.filter((task) => !task.completed).length;

  return (
    <>
      <Card className="p-4 bg-card border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t('memo.tasks.title')} ({pendingCount})
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('memo.tasks.addTask')}
            </TabsTrigger>
          </TabsList>

          {/* Tasks List Tab */}
          <TabsContent value="tasks" className="space-y-3 mt-4">
            {/* Toggle for completed tasks */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={(checked) => setShowCompleted(!!checked)}
                />
                <Label
                  htmlFor="show-completed"
                  className="text-sm cursor-pointer"
                >
                  {t('memo.tasks.showCompleted')} ({completedCount})
                </Label>
              </div>
            </div>

            {/* Tasks list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>
                  {showCompleted
                    ? t('memo.tasks.noTasks')
                    : t('memo.tasks.noPendingTasks')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Collapsible
                        open={expandedTaskId === task.id}
                        onOpenChange={(open) =>
                          setExpandedTaskId(open ? task.id : null)
                        }
                      >
                        <div
                          className={`border rounded-lg bg-card hover-lift ${
                            task.completed
                              ? 'opacity-60 border-primary/30'
                              : 'border-border'
                          }`}
                        >
                          {/* Task Header */}
                          <div className="p-3 flex items-center gap-3">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToComplete(task);
                              }}
                              className="cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </div>

                            <CollapsibleTrigger className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`font-medium ${
                                    task.completed
                                      ? 'line-through text-muted-foreground'
                                      : ''
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {expandedTaskId === task.id ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </CollapsibleTrigger>
                          </div>

                          {/* Expanded Content */}
                          <CollapsibleContent>
                            <div className="px-3 pb-3 space-y-3 border-t pt-3">
                              {/* Notes */}
                              {task.notes && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    {t('memo.tasks.taskNotes')}
                                  </Label>
                                  <p className="text-sm mt-1">{task.notes}</p>
                                </div>
                              )}

                              {/* Image */}
                              {task.image && (
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">
                                    {t('memo.tasks.taskImage')}
                                  </Label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openImageLightbox(task.image!)
                                    }
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    {t('memo.tasks.viewImage')}
                                  </button>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                  {t('memo.tasks.created')}{' '}
                                  {new Date(task.created_at).toLocaleString()}
                                </p>
                                {task.completed_at && (
                                  <p>
                                    {t('memo.tasks.completed')}{' '}
                                    {new Date(
                                      task.completed_at
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(task)}
                                  className="flex-1"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  {t('common.edit')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setTaskToDelete(task)}
                                  className="flex-1"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t('common.delete')}
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Add Task Tab */}
          <TabsContent value="add" className="mt-4">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">
                  {t('memo.tasks.taskTitle')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={t('memo.tasks.taskTitlePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-notes">{t('memo.tasks.taskNotes')}</Label>
                <Textarea
                  id="task-notes"
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder={t('memo.tasks.taskNotesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-image">{t('memo.tasks.taskImage')}</Label>
                <Input
                  id="task-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewTaskImage(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !newTaskTitle.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('memo.tasks.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('memo.tasks.createTask')}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('memo.tasks.editTask')}</DialogTitle>
            <DialogDescription>
              {t('memo.tasks.editTaskDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                {t('memo.tasks.taskTitle')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t('memo.tasks.taskTitlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('memo.tasks.taskNotes')}</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t('memo.tasks.taskNotesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">{t('memo.tasks.taskImage')}</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingTask(null)}
                className="flex-1"
                disabled={submitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleEditTask}
                className="flex-1"
                disabled={submitting || !editTitle.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('memo.tasks.saving')}
                  </>
                ) : (
                  t('memo.tasks.saveChanges')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Task Confirmation */}
      <ConfirmDialog
        open={!!taskToComplete}
        onOpenChange={(open) => !open && setTaskToComplete(null)}
        title={
          taskToComplete?.completed
            ? t('memo.tasks.markIncomplete')
            : t('memo.tasks.markComplete')
        }
        description={
          taskToComplete?.completed
            ? t('memo.tasks.markIncompleteDescription', {
                title: taskToComplete?.title,
              })
            : t('memo.tasks.markCompleteDescription', {
                title: taskToComplete?.title,
              })
        }
        confirmText={
          taskToComplete?.completed
            ? t('memo.tasks.markIncomplete')
            : t('memo.tasks.markComplete')
        }
        onConfirm={() => taskToComplete && handleToggleComplete(taskToComplete)}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title={t('memo.tasks.deleteTask')}
        description={t('memo.tasks.deleteTaskDescription', {
          title: taskToDelete?.title,
        })}
        confirmText={t('common.delete')}
        variant="destructive"
        onConfirm={() => taskToDelete && handleDeleteTask(taskToDelete)}
      />

      {/* Image Lightbox */}
      {lightboxImage && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: lightboxImage }]}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true,
          }}
        />
      )}
    </>
  );
}
