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
import { categoriesAPI } from '@/lib/api';
import { Category } from '@/types/task';
import { Plus, Edit3, Trash2, Settings, Loader2 } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: () => void;
}

interface CategoryFormData {
  name: string;
  name_nb?: string;
}

export function CategoryManager({
  categories,
  onCategoriesChange,
}: CategoryManagerProps) {
  const { language } = useUIStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_nb: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = {
    manageCategories:
      language === 'no' ? 'Administrer Kategorier' : 'Manage Categories',
    newCategory: language === 'no' ? 'Ny Kategori' : 'New Category',
    editCategory: language === 'no' ? 'Rediger Kategori' : 'Edit Category',
    categoryName: language === 'no' ? 'Kategorinavn' : 'Category Name',
    categoryNameNorwegian:
      language === 'no' ? 'Kategorinavn (Norsk)' : 'Category Name (Norwegian)',
    save: language === 'no' ? 'Lagre' : 'Save',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    delete: language === 'no' ? 'Slett' : 'Delete',
    deleteConfirm:
      language === 'no'
        ? 'Er du sikker på at du vil slette denne kategorien?'
        : 'Are you sure you want to delete this category?',
    deleteDescription:
      language === 'no'
        ? 'Denne handlingen kan ikke angres.'
        : 'This action cannot be undone.',
    noCategories:
      language === 'no' ? 'Ingen kategorier ennå' : 'No categories yet',
    createFirst:
      language === 'no'
        ? 'Opprett din første kategori'
        : 'Create your first category',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const categoryData = {
        name: formData.name.trim(),
        slug: formData.name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]/g, ''),
        ...(formData.name_nb?.trim() && { name_nb: formData.name_nb.trim() }),
      };

      if (editingCategory) {
        await categoriesAPI.updateCategory(
          editingCategory.id.toString(),
          categoryData
        );
      } else {
        await categoriesAPI.createCategory(categoryData);
      }

      onCategoriesChange();
      setShowForm(false);
      setFormData({ name: '', name_nb: '' });
      setEditingCategory(undefined);
    } catch (err: any) {
      console.error('Category operation failed:', err);
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    setLoading(true);
    try {
      await categoriesAPI.deleteCategory(categoryId.toString());
      onCategoriesChange();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, name_nb: category.name_nb || '' });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingCategory(undefined);
    setFormData({ name: '', name_nb: '' });
    setShowForm(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(undefined);
    setShowForm(false);
    setFormData({ name: '', name_nb: '' });
    setError(null);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          {texts.manageCategories}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{texts.manageCategories}</DialogTitle>
          <DialogDescription>
            {language === 'no'
              ? 'Opprett, rediger eller slett kategorier for oppgavene dine.'
              : 'Create, edit, or delete categories for your tasks.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {language === 'no'
                  ? 'Eksisterende Kategorier'
                  : 'Existing Categories'}
              </h4>
              <Button onClick={handleNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {texts.newCategory}
              </Button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{texts.noCategories}</p>
                <p className="text-xs">{texts.createFirst}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <Badge variant="outline">
                        {language === 'no' && category.name_nb
                          ? category.name_nb
                          : category.name}
                      </Badge>
                      {category.name_nb && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({category.name})
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
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
                              onClick={() => handleDelete(category.id)}
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

          {/* Category Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">
                {editingCategory ? texts.editCategory : texts.newCategory}
              </h4>

              <div className="space-y-2">
                <Label htmlFor="category-name">{texts.categoryName}</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Work, Personal, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-name-nb">
                  {texts.categoryNameNorwegian}
                </Label>
                <Input
                  id="category-name-nb"
                  value={formData.name_nb}
                  onChange={(e) =>
                    setFormData({ ...formData, name_nb: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Arbeid, Personlig, etc."
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
