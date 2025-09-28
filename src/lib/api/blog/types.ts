import { PaginatedResponse } from '../shared/types';

// Blog entity types
export interface PostAudio {
  id: string;
  audio: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
  duration?: number;
}

export interface PostYouTube {
  id: string;
  url: string;
  video_id: string;
  title?: string;
  order: number;
}

export interface PostImage {
  id: string;
  image: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  post_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  title_nb?: string; // Norwegian title
  content: string;
  content_nb?: string; // Norwegian content
  body_markdown?: string;
  body_markdown_nb?: string;
  excerpt?: string;
  excerpt_nb?: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags?: number[] | Tag[]; // Can be either tag IDs or full tag objects
  meta_description?: string;
  audio?: PostAudio[]; // Array of uploaded audio files
  images?: PostImage[]; // Array of uploaded images
  youtube_videos?: PostYouTube[]; // Array of YouTube videos
}

// Request payload types
export interface CreatePostPayload {
  title: string;
  title_nb?: string;
  slug: string;
  excerpt?: string;
  excerpt_nb?: string;
  body_markdown?: string;
  body_markdown_nb?: string;
  content?: string;
  content_nb?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: number[]; // Array of tag IDs
  meta_description?: string;
  author_id?: string;
  featured_image?: File | string;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;

export interface CreateTagPayload {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export type UpdateTagPayload = Partial<CreateTagPayload>;

export interface UploadAudioPayload {
  audio: File;
  title?: string;
}

export interface UploadImagePayload {
  image: File;
  alt_text?: string;
}

export interface UploadYouTubePayload {
  url: string;
  title?: string;
}

// Response types
export type GetPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPublicPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPostResponse = Post;
export type CreatePostResponse = Post;
export type UpdatePostResponse = Post;
export type DeletePostResponse = void;

export type GetTagsResponse = Tag[];
export type GetTagResponse = Tag;
export type CreateTagResponse = Tag;
export type UpdateTagResponse = Tag;
export type DeleteTagResponse = void;

export type UploadPostAudioResponse = PostAudio;
export type DeletePostAudioResponse = void;
export type UploadPostImageResponse = PostImage;
export type DeletePostImageResponse = void;
export type PostYouTubeResponse = PostYouTube;
export type UploadPostYouTubeResponse = PostYouTube;
export type DeletePostYouTubeResponse = void;

// Search and filter types
export interface PostSearchParams {
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  author_id?: string;
  tags?: number[];
  page?: number;
  page_size?: number;
  ordering?: string;
}