'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Upload, Image, Music } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { postsAPI, tagsAPI, Post, Tag } from '@/lib/api';
import { useIntl } from '@/hooks/use-intl';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { MediaLibrary } from './media-library';
import { TagInput } from './tag-input';
import { TagManager } from './tag-manager';
import { toast } from 'sonner';

interface BlogEditorProps {
  post?: Post | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const { t } = useIntl();
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [title, setTitle] = useState('');
  const [titleNb, setTitleNb] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [excerptNb, setExcerptNb] = useState('');
  const [content, setContent] = useState('');
  const [contentNb, setContentNb] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    'draft'
  );
  const [tags, setTags] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [metaDescription, setMetaDescription] = useState('');

  // Fetch available tags
  const fetchTags = useCallback(async () => {
    try {
      const tagsData = await tagsAPI.getTags();
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  // Initialize tags on component mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setTitleNb(post.title_nb || '');
      setSlug(post.slug || '');
      setExcerpt(post.excerpt || '');
      setExcerptNb(post.excerpt_nb || '');
      setContent(post.body_markdown || '');
      setContentNb(post.body_markdown_nb || '');
      setStatus(post.status);

      // Handle tags - they might be objects {id, name, slug}, tag IDs, or tag names
      const postTags = (post.tags || [])
        .map((tag) => {
          // If it's a tag object with an ID
          if (typeof tag === 'object' && tag !== null && 'id' in tag) {
            return tag.id;
          }

          // If it's already a number (tag ID)
          if (typeof tag === 'number') {
            return tag;
          }

          // If it's a string, try to find the corresponding tag ID from availableTags
          if (typeof tag === 'string') {
            const matchingTag = availableTags.find((t) => t.name === tag);
            if (matchingTag) {
              return matchingTag.id;
            } else {
              return null;
            }
          }

          // Try to convert to number as fallback
          const numericTag = Number(tag);
          return isNaN(numericTag) ? null : numericTag;
        })
        .filter((id) => id !== null && id !== undefined && id > 0); // Filter out invalid IDs

      setTags(postTags);
      setMetaDescription(post.meta_description || '');
    } else {
      // Reset form for new post
      setTitle('');
      setTitleNb('');
      setSlug('');
      setExcerpt('');
      setExcerptNb('');
      setContent('');
      setContentNb('');
      setStatus('draft');
      setTags([]);
      setMetaDescription('');
    }
    setHasUnsavedChanges(false);
    setErrors({}); // Clear errors when switching posts
  }, [post, availableTags]); // Include availableTags in dependencies

  // Track unsaved changes
  useEffect(() => {
    if (post) {
      const hasChanges =
        title !== (post.title || '') ||
        titleNb !== (post.title_nb || '') ||
        slug !== (post.slug || '') ||
        excerpt !== (post.excerpt || '') ||
        excerptNb !== (post.excerpt_nb || '') ||
        content !== (post.body_markdown || '') ||
        contentNb !== (post.body_markdown_nb || '') ||
        status !== post.status ||
        JSON.stringify(tags) !== JSON.stringify(post.tags || []) ||
        metaDescription !== (post.meta_description || '');
      setHasUnsavedChanges(hasChanges);
    } else {
      // For new posts, check if any field has content
      const hasContent =
        title.trim() !== '' ||
        titleNb.trim() !== '' ||
        slug.trim() !== '' ||
        excerpt.trim() !== '' ||
        excerptNb.trim() !== '' ||
        content.trim() !== '' ||
        contentNb.trim() !== '' ||
        tags.length > 0 ||
        metaDescription.trim() !== '';
      setHasUnsavedChanges(hasContent);
    }
  }, [
    title,
    titleNb,
    slug,
    excerpt,
    excerptNb,
    content,
    contentNb,
    status,
    tags,
    metaDescription,
    post,
  ]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Always auto-generate slug from title unless user has manually edited it
    if (!post || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (silent = false) => {
    // Clear previous errors
    setErrors({});

    if (!title.trim()) {
      if (!silent) toast.error(t('blog.editor.titleRequired'));
      setErrors({ title: [t('blog.editor.titleRequired')] });
      return false;
    }

    if (!slug.trim()) {
      if (!silent) toast.error(t('blog.editor.slugRequired'));
      setErrors({ slug: [t('blog.editor.slugRequired')] });
      return false;
    }

    try {
      setSaving(true);

      // Process tags - filter out any null/undefined/NaN values
      const processedTags = tags
        .map((id) => Number(id))
        .filter(
          (id) => !isNaN(id) && id !== null && id !== undefined && id > 0
        );

      const postData = {
        title: title.trim(),
        title_nb: titleNb.trim() || undefined,
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        excerpt_nb: excerptNb.trim() || undefined,
        body_markdown: content,
        body_markdown_nb: contentNb || undefined,
        status,
        tags: processedTags, // Clean, validated tag IDs
        meta_description: metaDescription.trim() || undefined,
        author_id: user?.id,
      };

      if (post) {
        await postsAPI.updatePost(post.id, postData);
        if (!silent) toast.success(t('blog.editor.postUpdated'));
      } else {
        await postsAPI.createPost(postData);
        if (!silent) toast.success(t('blog.editor.postCreated'));
      }

      setHasUnsavedChanges(false);
      setErrors({}); // Clear errors on successful save

      // Only trigger refresh for new posts, keep form open for updates
      if (!silent && !post) {
        onSave(); // Close form and refresh list for new posts
      }
      return true;
    } catch (error: any) {
      console.error('Save error:', error);

      // Handle validation errors from Django REST Framework
      if (error.response?.status === 400 && error.response?.data) {
        const errorData = error.response.data;
        setErrors(errorData);

        // Show field-specific errors in toast
        if (!silent) {
          const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'non_field_errors')
            .map(
              ([field, messages]) =>
                `${field}: ${Array.isArray(messages) ? messages[0] : messages}`
            )
            .join(', ');

          const nonFieldErrors = errorData.non_field_errors
            ? Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors[0]
              : errorData.non_field_errors
            : '';

          const errorMessage =
            nonFieldErrors || fieldErrors || t('blog.editor.saveError');
          toast.error(errorMessage);
        }
      } else {
        // Generic error handling
        if (!silent) toast.error(t('blog.editor.saveError'));
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Simple tab change without auto-save
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const handleMediaInsert = useCallback(
    (url: string, type: 'image' | 'audio') => {
      const currentContent = language === 'no' ? contentNb : content;
      const setCurrentContent = language === 'no' ? setContentNb : setContent;

      let insertText = '';
      if (type === 'image') {
        // Check if it's HTML (like YouTube embed) or a regular image URL
        if (url.includes('<iframe') || url.includes('<')) {
          insertText = url; // Raw HTML for embeds
        } else {
          insertText = `![Image](${url})`; // Markdown for images
        }
      } else if (type === 'audio') {
        insertText = `<audio controls><source src="${url}" type="audio/mpeg"></audio>`;
      }

      const newContent = currentContent + '\n\n' + insertText + '\n';
      setCurrentContent(newContent);
    },
    [language, content, contentNb]
  );

  // Helper component for displaying field errors
  const FieldError = ({ fieldName }: { fieldName: string }) => {
    const fieldErrors = errors[fieldName];
    if (!fieldErrors || fieldErrors.length === 0) return null;

    return (
      <div className="text-sm text-destructive mt-1">
        {fieldErrors.map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>
          {post ? t('blog.editor.editPost') : t('blog.editor.newPost')}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button onClick={() => handleSave()} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('common.saving') : t('common.save')}
            {hasUnsavedChanges && !saving && <span className="ml-1">*</span>}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Display non-field errors */}
        {errors.non_field_errors && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm text-destructive">
              {Array.isArray(errors.non_field_errors) ? (
                errors.non_field_errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))
              ) : (
                <div>{errors.non_field_errors}</div>
              )}
            </div>
          </div>
        )}

        {/* Display general errors that don't have specific field mapping */}
        {Object.entries(errors).some(
          ([key, value]) =>
            ![
              'non_field_errors',
              'title',
              'title_nb',
              'slug',
              'excerpt',
              'excerpt_nb',
              'body_markdown',
              'body_markdown_nb',
              'status',
              'tags',
              'meta_description',
            ].includes(key)
        ) && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm text-destructive">
              <div className="font-medium mb-1">
                Additional validation errors:
              </div>
              {Object.entries(errors)
                .filter(
                  ([key]) =>
                    ![
                      'non_field_errors',
                      'title',
                      'title_nb',
                      'slug',
                      'excerpt',
                      'excerpt_nb',
                      'body_markdown',
                      'body_markdown_nb',
                      'status',
                      'tags',
                      'meta_description',
                    ].includes(key)
                )
                .map(([field, messages]) => (
                  <div key={field}>
                    <strong>{field}:</strong>{' '}
                    {Array.isArray(messages) ? messages[0] : messages}
                  </div>
                ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">
              {t('blog.editor.content')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              {t('blog.editor.settings')}
            </TabsTrigger>
            <TabsTrigger value="media">{t('blog.editor.media')}</TabsTrigger>
            <TabsTrigger value="preview">
              {t('blog.editor.preview')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">{t('blog.editor.titleEn')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('blog.editor.titlePlaceholder')}
                  className={errors.title ? 'border-destructive' : ''}
                />
                <FieldError fieldName="title" />
              </div>
              <div>
                <Label htmlFor="title-nb">{t('blog.editor.titleNo')}</Label>
                <Input
                  id="title-nb"
                  value={titleNb}
                  onChange={(e) => setTitleNb(e.target.value)}
                  placeholder={t('blog.editor.titlePlaceholder')}
                  className={errors.title_nb ? 'border-destructive' : ''}
                />
                <FieldError fieldName="title_nb" />
              </div>
            </div>

            <div>
              <Label htmlFor="slug">{t('blog.editor.slug')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
                className={errors.slug ? 'border-destructive' : ''}
              />
              <FieldError fieldName="slug" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="excerpt">{t('blog.editor.excerptEn')}</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={t('blog.editor.excerptPlaceholder')}
                  rows={3}
                  className={errors.excerpt ? 'border-destructive' : ''}
                />
                <FieldError fieldName="excerpt" />
              </div>
              <div>
                <Label htmlFor="excerpt-nb">{t('blog.editor.excerptNo')}</Label>
                <Textarea
                  id="excerpt-nb"
                  value={excerptNb}
                  onChange={(e) => setExcerptNb(e.target.value)}
                  placeholder={t('blog.editor.excerptPlaceholder')}
                  rows={3}
                  className={errors.excerpt_nb ? 'border-destructive' : ''}
                />
                <FieldError fieldName="excerpt_nb" />
              </div>
            </div>

            <div>
              <Label>{t('blog.editor.contentEn')}</Label>
              <div className="mt-2">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  preview="edit"
                  hideToolbar={false}
                  height={400}
                  data-color-mode={
                    document.documentElement.classList.contains('dark')
                      ? 'dark'
                      : 'light'
                  }
                />
              </div>
              <FieldError fieldName="body_markdown" />
            </div>

            <div>
              <Label>{t('blog.editor.contentNo')}</Label>
              <div className="mt-2">
                <MDEditor
                  value={contentNb}
                  onChange={(val) => setContentNb(val || '')}
                  preview="edit"
                  hideToolbar={false}
                  height={400}
                  data-color-mode={
                    document.documentElement.classList.contains('dark')
                      ? 'dark'
                      : 'light'
                  }
                />
              </div>
              <FieldError fieldName="body_markdown_nb" />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">{t('blog.editor.status')}</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as any)}
                >
                  <SelectTrigger
                    className={errors.status ? 'border-destructive' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      {t('blog.status.draft')}
                    </SelectItem>
                    <SelectItem value="published">
                      {t('blog.status.published')}
                    </SelectItem>
                    <SelectItem value="archived">
                      {t('blog.status.archived')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError fieldName="status" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>{t('blog.editor.tags')}</Label>
                  <TagManager tags={availableTags} onTagsChange={fetchTags} />
                </div>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  availableTags={availableTags}
                  placeholder={t('blog.editor.tagsPlaceholder')}
                />
                <FieldError fieldName="tags" />
              </div>
            </div>

            <div>
              <Label htmlFor="meta-description">
                {t('blog.editor.metaDescription')}
              </Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t('blog.editor.metaDescriptionPlaceholder')}
                rows={3}
                className={errors.meta_description ? 'border-destructive' : ''}
              />
              <FieldError fieldName="meta_description" />
            </div>
          </TabsContent>

          <TabsContent value="media">
            {post ? (
              <MediaLibrary postId={post.id} onInsert={handleMediaInsert} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('blog.editor.savePostForMedia')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <div className="prose max-w-none">
              <h1>{language === 'no' ? titleNb || title : title}</h1>
              {(excerpt || excerptNb) && (
                <p className="lead">
                  {language === 'no' ? excerptNb || excerpt : excerpt}
                </p>
              )}
              <MDEditor.Markdown
                source={language === 'no' ? contentNb || content : content}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
