'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { postsAPI, Post } from '@/lib/api';
import { useUIStore } from '@/stores/ui';
import { useIntl } from '@/hooks/use-intl';

// YouTube Video Card Component
function YouTubeVideoCard() {
  const { language } = useUIStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full hover-lift">
      <CardHeader>
        <CardTitle className="text-3xl">
          {language === 'no'
            ? 'Velkommen til nxfs.no - Introduksjonsvideo'
            : 'Welcome to nxfs.no - Introduction Video'}
        </CardTitle>
        <p className="text-lg text-muted-foreground mt-2">
          {language === 'no'
            ? 'Se denne videoen for å lære mer om plattformen og hva vi tilbyr'
            : 'Watch this video to learn more about our platform and what we offer'}
        </p>
        <CardDescription>{formatDate('2025-09-20')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div
            className="relative w-full"
            style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}
          >
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/C9j0eJsA7-8"
              title="nxfs.no Introduction Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Author {
  id: string;
  email: string;
  display_name?: string;
  profile_picture?: string;
}
interface AudioFile {
  id: string;
  url: string; // URL to the audio file
  title?: string;
  duration?: number; // Duration in seconds
  order?: number; // Order if multiple audio files
}

// Extend the API Post type with additional blog-specific fields
interface BlogPost extends Post {
  body_html?: string; // Optional since we use body_markdown
  author?: Author; // Author object for display
  excerpt_nb?: string;
  audio_files?: AudioFile[];
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const { language } = useUIStore();
  const { t } = useIntl();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full hover-lift">
      <CardHeader>
        <CardTitle className="text-3xl">
          {language === 'no' ? post.title_nb : post.title}
        </CardTitle>
        {(post.excerpt || post.excerpt_nb) && (
          <p className="text-lg text-muted-foreground mt-2">
            {language === 'no' ? post.excerpt_nb : post.excerpt}
          </p>
        )}
        {post.audio_files && post.audio_files.length > 0 && (
          <audio controls className="h-8">
            <source
              src={`https://api.nxfs.no${post.audio_files[0].url}`}
              type="audio/mpeg"
            />
            Your browser does not support the audio element.
          </audio>
        )}
        <CardDescription>
          {post.author && (
            <span>
              {t('blog.author')} {post.author.display_name || post.author.email}
              {' • '}
            </span>
          )}
          {formatDate(post.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-6 mb-4 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-5 mb-3 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-medium mt-4 mb-2 text-foreground">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-medium mt-3 mb-2 text-foreground">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-base font-medium mt-2 mb-1 text-foreground">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm font-medium mt-2 mb-1 text-foreground">
                  {children}
                </h6>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-foreground">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              code: ({ node, children, ...props }) => {
                // Check if the code block is inline
                const isInline =
                  node && typeof node === 'object' && 'inline' in node
                    ? (node as { inline?: boolean }).inline
                    : false;
                if (isInline) {
                  return (
                    <code
                      className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className="block bg-muted p-3 rounded-lg text-sm font-mono text-foreground overflow-x-auto"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-4">
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground">{children}</em>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg my-4"
                />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              hr: () => <hr className="my-6 border-border" />,
            }}
          >
            {language === 'no' ? post.body_markdown_nb : post.body_markdown}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogPostSkeleton() {
  return (
    <Card className="w-full hover-lift">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
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
  );
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useUIStore();
  const { t } = useIntl();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real posts from API
        const response = await postsAPI.getPublicPosts();

        // Handle both array and paginated response formats
        const postsArray = Array.isArray(response)
          ? response
          : response.results || [];

        // Transform API Post data to BlogPost format
        const transformedPosts: BlogPost[] = postsArray.map((post: Post) => ({
          ...post,
          // Add any missing fields or transformations here
          body_html: post.body_markdown, // Use markdown as html fallback if needed
        }));

        setPosts(transformedPosts);
      } catch (err: any) {
        setError(err.response?.data?.message || t('blog.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [language, t]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <BlogPostSkeleton key={i} />
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">{t('blog.noPosts')}</h2>
        <p className="text-muted-foreground">{t('blog.beFirstToPost')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YouTubeVideoCard />
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
