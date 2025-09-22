'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit, Eye } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useIntl } from '@/hooks/use-intl';
import { useUIStore } from '@/stores/ui';
import { Post } from '@/types/api';
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

interface BlogPostListProps {
  onEditPost: (post: Post) => void;
  selectedPostId?: string;
}

export function BlogPostList({
  onEditPost,
  selectedPostId,
}: BlogPostListProps) {
  const { t } = useIntl();
  const { language } = useUIStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsAPI.getPosts();
      const postsArray = Array.isArray(response)
        ? response
        : response.results || [];
      setPosts(postsArray);
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('blog.admin.errorLoadingPosts')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    try {
      setDeletingId(postId);
      await postsAPI.deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('blog.admin.errorDeletingPost')
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: t('blog.status.draft'), variant: 'secondary' as const },
      published: {
        label: t('blog.status.published'),
        variant: 'default' as const,
      },
      archived: {
        label: t('blog.status.archived'),
        variant: 'outline' as const,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border rounded">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('blog.admin.noPosts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`p-3 border rounded-lg hover:bg-accent/50 transition-colors ${
            selectedPostId === post.id ? 'bg-accent border-primary' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-sm line-clamp-2">
              {language === 'no' ? post.title_nb || post.title : post.title}
            </h3>
            {getStatusBadge(post.status)}
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {formatDate(post.updated_at)}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditPost(post)}
              className="h-7 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>

            {post.status === 'published' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  disabled={deletingId === post.id}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('blog.admin.deleteConfirmTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('blog.admin.deleteConfirmDescription')}
                    <br />
                    <strong>
                      "
                      {language === 'no'
                        ? post.title_nb || post.title
                        : post.title}
                      "
                    </strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(post.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
