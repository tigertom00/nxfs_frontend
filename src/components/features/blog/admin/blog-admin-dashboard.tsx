'use client';

import { useState } from 'react';
import { postsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BlogPostList } from './blog-post-list';
import { BlogEditor } from './blog-editor';
import { useIntl } from '@/hooks/use-intl';
import { Post } from '@/types/api';

export function BlogAdminDashboard() {
  const { t } = useIntl();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewPost = () => {
    setSelectedPost(null);
    setIsCreating(true);
  };

  const handleEditPost = (post: Post) => {
    // Use the post data from the list directly since it already contains all necessary data
    setSelectedPost(post);
    setIsCreating(false);
  };

  const handleSaveComplete = () => {
    setSelectedPost(null);
    setIsCreating(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setSelectedPost(null);
    setIsCreating(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('blog.admin.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('blog.admin.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-1">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{t('blog.admin.posts')}</CardTitle>
              <Button onClick={handleNewPost} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('blog.admin.newPost')}
              </Button>
            </CardHeader>
            <CardContent>
              <BlogPostList
                key={refreshKey}
                onEditPost={handleEditPost}
                selectedPostId={selectedPost?.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {isCreating || selectedPost ? (
            <BlogEditor
              post={selectedPost}
              onSave={handleSaveComplete}
              onCancel={handleCancel}
            />
          ) : (
            <Card className="hover-lift">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">
                    {t('blog.admin.selectPost')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('blog.admin.selectPostDescription')}
                  </p>
                  <Button onClick={handleNewPost}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('blog.admin.createFirst')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
