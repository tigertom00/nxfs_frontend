'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Upload, Image, Music } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { postsAPI, tagsAPI } from '@/lib/api';
import { useIntl } from '@/hooks/use-intl';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { Post, Tag } from '@/types/api';
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

  // Form state
  const [title, setTitle] = useState('');
  const [titleNb, setTitleNb] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [excerptNb, setExcerptNb] = useState('');
  const [content, setContent] = useState('');
  const [contentNb, setContentNb] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
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
      setTags(post.tags || []);
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
  }, [post]);

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
    if (!post && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('blog.editor.titleRequired'));
      return;
    }

    if (!slug.trim()) {
      toast.error(t('blog.editor.slugRequired'));
      return;
    }

    try {
      setSaving(true);

      const postData = {
        title: title.trim(),
        title_nb: titleNb.trim() || undefined,
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        excerpt_nb: excerptNb.trim() || undefined,
        body_markdown: content,
        body_markdown_nb: contentNb || undefined,
        status,
        tags: tags,
        meta_description: metaDescription.trim() || undefined,
        author_id: user?.id,
      };

      if (post) {
        await postsAPI.updatePost(post.id, postData);
        toast.success(t('blog.editor.postUpdated'));
      } else {
        await postsAPI.createPost(postData);
        toast.success(t('blog.editor.postCreated'));
      }

      onSave();
    } catch (error: any) {
      toast.error(t('blog.editor.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleMediaInsert = useCallback((url: string, type: 'image' | 'audio') => {
    const currentContent = language === 'no' ? contentNb : content;
    const setCurrentContent = language === 'no' ? setContentNb : setContent;

    let insertText = '';
    if (type === 'image') {
      insertText = `![Image](${url})`;
    } else if (type === 'audio') {
      insertText = `<audio controls><source src="${url}" type="audio/mpeg"></audio>`;
    }

    const newContent = currentContent + '\n\n' + insertText + '\n';
    setCurrentContent(newContent);
  }, [language, content, contentNb]);

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
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">{t('blog.editor.content')}</TabsTrigger>
            <TabsTrigger value="settings">{t('blog.editor.settings')}</TabsTrigger>
            <TabsTrigger value="media">{t('blog.editor.media')}</TabsTrigger>
            <TabsTrigger value="preview">{t('blog.editor.preview')}</TabsTrigger>
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
                />
              </div>
              <div>
                <Label htmlFor="title-nb">{t('blog.editor.titleNo')}</Label>
                <Input
                  id="title-nb"
                  value={titleNb}
                  onChange={(e) => setTitleNb(e.target.value)}
                  placeholder={t('blog.editor.titlePlaceholder')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="slug">{t('blog.editor.slug')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
              />
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
                />
              </div>
              <div>
                <Label htmlFor="excerpt-nb">{t('blog.editor.excerptNo')}</Label>
                <Textarea
                  id="excerpt-nb"
                  value={excerptNb}
                  onChange={(e) => setExcerptNb(e.target.value)}
                  placeholder={t('blog.editor.excerptPlaceholder')}
                  rows={3}
                />
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
                  visibleDragBar={false}
                  height={400}
                />
              </div>
            </div>

            <div>
              <Label>{t('blog.editor.contentNo')}</Label>
              <div className="mt-2">
                <MDEditor
                  value={contentNb}
                  onChange={(val) => setContentNb(val || '')}
                  preview="edit"
                  hideToolbar={false}
                  visibleDragBar={false}
                  height={400}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">{t('blog.editor.status')}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('blog.status.draft')}</SelectItem>
                    <SelectItem value="published">{t('blog.status.published')}</SelectItem>
                    <SelectItem value="archived">{t('blog.status.archived')}</SelectItem>
                  </SelectContent>
                </Select>
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
              </div>
            </div>

            <div>
              <Label htmlFor="meta-description">{t('blog.editor.metaDescription')}</Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t('blog.editor.metaDescriptionPlaceholder')}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="media">
            {post ? (
              <MediaLibrary
                postId={post.id}
                onInsert={handleMediaInsert}
              />
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