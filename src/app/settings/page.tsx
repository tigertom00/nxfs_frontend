'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { CategoryManager, ProjectManager } from '@/components/features/tasks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore, useUIStore } from '@/stores';
import {
  categoriesAPI,
  projectsAPI,
  usersAPI,
  Category,
  Project,
} from '@/lib/api';
import {
  Settings as SettingsIcon,
  Globe,
  Palette,
  FolderKanban,
  Tags,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { isAuthenticated, user, isLoading, initialize, isInitialized } =
    useAuthStore();
  const { theme, language, setTheme, setLanguage } = useUIStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [_loading, _setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Fetch data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCategories();
      fetchProjects();
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'no') => {
    setLanguage(newLanguage);
    await savePreferences(newLanguage, theme || 'system');
  };

  const handleThemeChange = async (
    newTheme: 'light' | 'dark' | 'purple' | 'pink' | 'system'
  ) => {
    setTheme(newTheme);
    await savePreferences(user?.language || 'en', newTheme);
  };

  const savePreferences = async (
    lang: 'en' | 'no',
    themePreference: 'light' | 'dark' | 'purple' | 'pink' | 'system'
  ) => {
    if (!user) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      await usersAPI.updateUser(user.id, {
        language: lang,
        theme: themePreference,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setSaveStatus('error');
      setError('Failed to save preferences');
    }
  };

  const texts = {
    settings: language === 'no' ? 'Innstillinger' : 'Settings',
    personalPreferences:
      language === 'no' ? 'Personlige Innstillinger' : 'Personal Preferences',
    language: language === 'no' ? 'Språk' : 'Language',
    theme: language === 'no' ? 'Tema' : 'Theme',
    projectManagement:
      language === 'no' ? 'Prosjektadministrasjon' : 'Project Management',
    categoryManagement:
      language === 'no' ? 'Kategori-administrasjon' : 'Category Management',
    manageProjects:
      language === 'no' ? 'Administrer Prosjekter' : 'Manage Projects',
    manageCategories:
      language === 'no' ? 'Administrer Kategorier' : 'Manage Categories',
    projectsDescription:
      language === 'no'
        ? 'Organiser oppgavene dine med prosjekter'
        : 'Organize your tasks with projects',
    categoriesDescription:
      language === 'no'
        ? 'Kategoriser oppgavene dine for bedre organisering'
        : 'Categorize your tasks for better organization',
    preferencesDescription:
      language === 'no'
        ? 'Tilpass språk og utseende etter dine preferanser'
        : 'Customize language and appearance to your preferences',
    english: 'English',
    norwegian: 'Norsk',
    light: language === 'no' ? 'Lys' : 'Light',
    dark: language === 'no' ? 'Mørk' : 'Dark',
    purple: language === 'no' ? 'Lilla' : 'Purple',
    pink: language === 'no' ? 'Rosa' : 'Pink',
    system: language === 'no' ? 'System' : 'System',
    saved: language === 'no' ? 'Lagret!' : 'Saved!',
    saving: language === 'no' ? 'Lagrer...' : 'Saving...',
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {texts.settings}
              </h1>
              <p className="text-muted-foreground">
                {language === 'no'
                  ? 'Administrer dine preferanser og innstillinger'
                  : 'Manage your preferences and settings'}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Preferences */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {texts.personalPreferences}
                </CardTitle>
                <CardDescription>
                  {texts.preferencesDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {texts.language}
                  </Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{texts.english}</SelectItem>
                      <SelectItem value="no">{texts.norwegian}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {texts.theme}
                  </Label>
                  <Select
                    value={theme || 'system'}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">{texts.system}</SelectItem>
                      <SelectItem value="light">{texts.light}</SelectItem>
                      <SelectItem value="dark">{texts.dark}</SelectItem>
                      <SelectItem value="purple">{texts.purple}</SelectItem>
                      <SelectItem value="pink">{texts.pink}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Status */}
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {texts.saving}
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {texts.saved}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  {texts.projectManagement}
                </CardTitle>
                <CardDescription>{texts.projectsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectManager
                  projects={projects}
                  onProjectsChange={fetchProjects}
                  userId={Number(user?.id)}
                />
              </CardContent>
            </Card>

            {/* Category Management */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  {texts.categoryManagement}
                </CardTitle>
                <CardDescription>{texts.categoriesDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryManager
                  categories={categories}
                  onCategoriesChange={fetchCategories}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
