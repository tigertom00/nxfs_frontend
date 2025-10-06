'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { tagsAPI, Tag } from '@/lib/api';
import { Plus, Edit3, Trash2, Settings, Loader2 } from 'lucide-react';

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: () => void;
}

interface TagFormData {
  name: string;
}

export function TagManager({ tags, onTagsChange }: TagManagerProps) {
  const { language } = useUIStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = {
    manageTags: language === 'no' ? 'Administrer Tagger' : 'Manage Tags',
    newTag: language === 'no' ? 'Ny Tagg' : 'New Tag',
    editTag: language === 'no' ? 'Rediger Tagg' : 'Edit Tag',
    tagName: language === 'no' ? 'Taggnavn' : 'Tag Name',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    delete: language === 'no' ? 'Slett' : 'Delete',
    deleteConfirm:
      language === 'no'
        ? 'Er du sikker på at du vil slette denne taggen?'
        : 'Are you sure you want to delete this tag?',
    deleteDescription:
      language === 'no'
        ? 'Denne handlingen kan ikke angres.'
        : 'This action cannot be undone.',
    noTags: language === 'no' ? 'Ingen tagger ennå' : 'No tags yet',
    createFirst:
      language === 'no' ? 'Opprett din første tagg' : 'Create your first tag',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
    description:
      language === 'no'
        ? 'Opprett, rediger eller slett tagger for blogginnleggene dine.'
        : 'Create, edit, or delete tags for your blog posts.',
    existingTags: language === 'no' ? 'Eksisterende Tagger' : 'Existing Tags',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {return;}

    setLoading(true);
    setError(null);

    try {
      const tagData = {
        name: formData.name.trim(),
        slug: formData.name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]/g, ''),
      };

      if (editingTag) {
        await tagsAPI.updateTag(editingTag.id.toString(), tagData);
      } else {
        await tagsAPI.createTag(tagData);
      }

      onTagsChange();
      setShowForm(false);
      setFormData({ name: '' });
      setEditingTag(undefined);
    } catch (err: any) {
      console.error('Tag operation failed:', err);
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tagId: number) => {
    setLoading(true);
    try {
      await tagsAPI.deleteTag(tagId.toString());
      onTagsChange();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingTag(undefined);
    setFormData({ name: '' });
    setShowForm(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(undefined);
    setShowForm(false);
    setFormData({ name: '' });
    setError(null);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          {texts.manageTags}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{texts.manageTags}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tag List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{texts.existingTags}</h4>
              <Button onClick={handleNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {texts.newTag}
              </Button>
            </div>

            {tags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{texts.noTags}</p>
                <p className="text-xs">{texts.createFirst}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <Badge variant="outline">{tag.name}</Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({tag.slug})
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
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
                              onClick={() => handleDelete(tag.id)}
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

          {/* Tag Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">
                {editingTag ? texts.editTag : texts.newTag}
              </h4>

              <div className="space-y-2">
                <Label htmlFor="tag-name">{texts.tagName}</Label>
                <Input
                  id="tag-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Technology, Travel, etc."
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
