'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore, useUIStore } from '@/stores';
import { postsAPI, Post } from '@/lib/api';
import { useIntl } from '@/hooks/use-intl';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Edit, Eye, Calendar, FileText } from 'lucide-react';

export default function MyBlogPostsPage() {
  const { isAuthenticated, user, isInitialized } = useAuthStore();
  const { language, theme } = useUIStore();
  const { t } = useIntl();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    document.documentElement.classList.remove(
      'light',
      'dark',
      'purple',
      'pink',
      'system'
    );
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);
        const response = await postsAPI.getPosts();
        const postsArray = Array.isArray(response)
          ? response
          : response.results || [];
        setPosts(postsArray);
      } catch (err: any) {
        setError(err.response?.data?.message || t('blog.myPosts.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMyPosts();
    }
  }, [isAuthenticated, t]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: t('blog.status.draft'),
        variant: 'secondary' as const,
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      published: {
        label: t('blog.status.published'),
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      archived: {
        label: t('blog.status.archived'),
        variant: 'outline' as const,
        className:
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = searchTerm
      ? post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.title_nb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt_nb?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesStatus =
      statusFilter === 'all' || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('blog.myPosts.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('blog.myPosts.description')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/blog/admin')}
                  variant="outline"
                  className="hover-lift"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('blog.myPosts.manage')}
                </Button>
                <Button
                  onClick={() => router.push('/blog/admin')}
                  className="hover-lift"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('blog.myPosts.newPost')}
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder={t('blog.myPosts.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background border-input"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('blog.myPosts.allStatus')}
                        </SelectItem>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredPosts.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {posts.length === 0
                    ? t('blog.myPosts.noPosts')
                    : t('blog.myPosts.noFilterResults')}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {posts.length === 0
                    ? t('blog.myPosts.noPostsDescription')
                    : t('blog.myPosts.noFilterResultsDescription')}
                </p>
                {posts.length === 0 && (
                  <Button
                    onClick={() => router.push('/blog/admin')}
                    className="hover-lift"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('blog.myPosts.createFirst')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border hover-lift h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg line-clamp-2 text-foreground">
                          {language === 'no'
                            ? post.title_nb || post.title
                            : post.title}
                        </CardTitle>
                        {getStatusBadge(post.status)}
                      </div>
                      {(post.excerpt || post.excerpt_nb) && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {language === 'no'
                            ? post.excerpt_nb || post.excerpt
                            : post.excerpt}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div className="flex items-center text-xs text-muted-foreground mb-4">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(post.updated_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/blog/admin')}
                          className="flex-1 hover-lift-only"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          {t('common.edit')}
                        </Button>
                        {post.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(`/blog/${post.slug}`, '_blank')
                            }
                            className="hover-lift-only"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Stats */}
          {!loading && !error && posts.length > 0 && (
            <motion.div
              className="mt-8 text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {t('blog.myPosts.showing', {
                count: filteredPosts.length,
                total: posts.length,
              })}
            </motion.div>
          )}
        </motion.div>
      </main>
      <ChatBot />
    </div>
  );
}
