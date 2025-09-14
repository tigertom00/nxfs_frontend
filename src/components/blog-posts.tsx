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
import { postsAPI } from '@/lib/api';
import { useUIStore } from '@/stores/ui';

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

interface BlogPost {
  id: string;
  title: string;
  title_nb?: string;
  body_markdown_nb?: string;
  body_markdown: string;
  body_html: string;
  created_at: string;
  updated_at: string;
  author?: Author; // <-- now an object
  excerpt?: string;
  excerpt_nb?: string;
  audio_files?: AudioFile[];
}

function BlogPostCard({ post }: { post: BlogPost }) {
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
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-3xl'>
          {language === 'no' ? post.title_nb : post.title}
        </CardTitle>
        {post.audio_files && post.audio_files.length > 0 && (
          <audio controls className='h-8'>
            <source
              src={`https://api.nxfs.no${post.audio_files[0].url}`}
              type='audio/mpeg'
            />
            Your browser does not support the audio element.
          </audio>
        )}
        <CardDescription>
          {post.author && (
            <span>
              {language === 'no' ? 'Av ' : 'By '}
              {post.author.display_name || post.author.email}
              {' • '}
            </span>
          )}
          {formatDate(post.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='max-w-none'>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h1: ({ children }) => (
                <h1 className='text-3xl font-bold mt-6 mb-4 text-foreground'>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className='text-2xl font-semibold mt-5 mb-3 text-foreground'>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className='text-xl font-medium mt-4 mb-2 text-foreground'>
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className='text-lg font-medium mt-3 mb-2 text-foreground'>
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className='text-base font-medium mt-2 mb-1 text-foreground'>
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className='text-sm font-medium mt-2 mb-1 text-foreground'>
                  {children}
                </h6>
              ),
              p: ({ children }) => (
                <p className='mb-4 leading-relaxed text-foreground'>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className='mb-4 ml-6 list-disc space-y-1 text-foreground'>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className='mb-4 ml-6 list-decimal space-y-1 text-foreground'>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className='text-foreground'>{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className='border-l-4 border-primary pl-4 my-4 italic text-muted-foreground'>
                  {children}
                </blockquote>
              ),
              code: ({ node, children, ...props }) => {
                // Check if the code block is inline
                const isInline =
                  node && typeof node === 'object' && 'inline' in node
                    ? (node as any).inline
                    : false;
                if (isInline) {
                  return (
                    <code
                      className='bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground'
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className='block bg-muted p-3 rounded-lg text-sm font-mono text-foreground overflow-x-auto'
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className='bg-muted p-3 rounded-lg overflow-x-auto my-4'>
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className='font-semibold text-foreground'>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className='italic text-foreground'>{children}</em>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className='text-primary hover:underline underline-offset-4'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className='max-w-full h-auto rounded-lg my-4'
                />
              ),
              table: ({ children }) => (
                <div className='overflow-x-auto my-4'>
                  <table className='min-w-full border-collapse border border-border'>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className='border border-border px-4 py-2 bg-muted font-semibold text-left'>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className='border border-border px-4 py-2'>{children}</td>
              ),
              hr: () => <hr className='my-6 border-border' />,
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
    <Card className='w-full'>
      <CardHeader>
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await postsAPI.getPublicPosts();
        setPosts(response);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            (language === 'no'
              ? 'Kunne ikke laste blogginnlegg'
              : 'Failed to load blog posts')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [language]);

  if (loading) {
    return (
      <div className='space-y-6'>
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
      <div className='text-center py-12'>
        <h2 className='text-2xl font-semibold mb-4'>
          {language === 'no' ? 'Ingen blogginnlegg ennå' : 'No blog posts yet'}
        </h2>
        <p className='text-muted-foreground'>
          {language === 'no'
            ? 'Vær den første til å publisere et innlegg!'
            : 'Be the first to publish a post!'}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
