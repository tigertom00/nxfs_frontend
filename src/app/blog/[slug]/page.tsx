'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { postsAPI, Post } from '@/lib/api';
import { useUIStore } from '@/stores/ui';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { language, theme } = useUIStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Get all public posts and find by slug
        const response = await postsAPI.getPublicPosts();
        const postsArray = Array.isArray(response)
          ? response
          : response.results || [];
        // Only show published posts to public users
        const foundPost = postsArray.find(
          (p: Post) => p.slug === slug && p.status === 'published'
        );

        if (!foundPost) {
          setError('Post not found');
          return;
        }

        setPost(foundPost);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </main>
        <ChatBot />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Alert className="max-w-4xl mx-auto">
            <AlertDescription>{error || 'Post not found'}</AlertDescription>
          </Alert>
        </main>
        <ChatBot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <article>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">
                {language === 'no' ? post.title_nb || post.title : post.title}
              </CardTitle>

              {(post.excerpt || post.excerpt_nb) && (
                <p className="text-lg text-muted-foreground mt-2">
                  {language === 'no'
                    ? post.excerpt_nb || post.excerpt
                    : post.excerpt}
                </p>
              )}

              {post.audio && post.audio.length > 0 && (
                <audio controls className="h-8 mt-4">
                  <source
                    src={`https://api.nxfs.no${post.audio[0].audio}`}
                    type="audio/mpeg"
                  />
                  Your browser does not support the audio element.
                </audio>
              )}

              <div className="text-sm text-muted-foreground mt-4">
                {formatDate(post.published_at || post.created_at)}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2">
                    <span>Tags: </span>
                    {post.tags.map((tag, index) => (
                      <span key={tag}>
                        {tag}
                        {index < post.tags!.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ src, alt }) => (
                      <img
                        src={
                          typeof src === 'string' && src.startsWith('http')
                            ? src
                            : `https://api.nxfs.no${src}`
                        }
                        alt={alt}
                        className="max-w-full h-auto rounded-lg my-4"
                      />
                    ),
                    audio: ({ children, ...props }) => (
                      <audio controls className="w-full my-4" {...props}>
                        {children}
                      </audio>
                    ),
                    iframe: ({ src, title, ...props }) => (
                      <div className="my-4 aspect-video">
                        <iframe
                          src={src}
                          title={title}
                          className="w-full h-full rounded-lg"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          {...props}
                        />
                      </div>
                    ),
                  }}
                >
                  {language === 'no'
                    ? post.body_markdown_nb || post.body_markdown
                    : post.body_markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>
      <ChatBot />
    </div>
  );
}
