// Base API response types for type-safe API calls

/**
 * Generic API response wrapper
 * Most of your API responses follow this pattern
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  timestamp?: string;
}

/**
 * Paginated response for list endpoints
 * Common in Django REST Framework APIs
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Error response structure
 * Standardizes error handling across the API
 */
export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
  timestamp?: string;
}

/**
 * Authentication response types
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string; // Some APIs return new refresh token
}

/**
 * User types based on your API structure
 */
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login?: string;
}

/**
 * Task-related types - matching your existing API structure
 * Using the same types as defined in types/task.ts for consistency
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_time?: number;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  category: number[]; // Array of Category IDs (ManyToMany)
  project?: number; // Foreign key to Project (can be null)
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  name_nb?: string;
}

export interface Project {
  id: number;
  name: string;
  name_nb?: string;
  description?: string;
  description_nb?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  completed: boolean;
  completed_at?: string;
  tasks: number[]; // Array of Task IDs
  status: 'todo' | 'in_progress' | 'completed';
  status_nb: 'å gjøre' | 'pågående' | 'fullført';
}

/**
 * Post types for blog functionality
 */
export interface Post {
  id: string;
  title: string;
  title_nb?: string; // Norwegian title
  content: string;
  content_nb?: string; // Norwegian content
  body_markdown?: string;
  body_markdown_nb?: string;
  excerpt?: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags?: string[];
  meta_description?: string;
}

/**
 * API request/payload types
 */
export interface CreateTaskPayload {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_time?: string | number; // Can be string from form or number in API
  category?: number[];
  project?: number;
  user_id: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

/**
 * API endpoint response types
 * These match your actual API responses
 */

// User API responses
export type GetCurrentUserResponse = User[]; // Your API returns array with one user
export type UpdateUserResponse = User;

// Tasks API responses
export type GetTasksResponse = Task[];
export type GetTaskResponse = Task;
export type CreateTaskResponse = Task;
export type UpdateTaskResponse = Task;
export type DeleteTaskResponse = void;

// Categories API responses
export type GetCategoriesResponse = Category[];
export type GetCategoryResponse = Category;
export type CreateCategoryResponse = Category;
export type UpdateCategoryResponse = Category;
export type DeleteCategoryResponse = void;

// Projects API responses
export type GetProjectsResponse = Project[];
export type GetProjectResponse = Project;
export type CreateProjectResponse = Project;
export type UpdateProjectResponse = Project;
export type DeleteProjectResponse = void;

// Posts API responses
export type GetPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPublicPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPostResponse = Post;
export type CreatePostResponse = Post;
export type UpdatePostResponse = Post;
export type DeletePostResponse = void;

// Chatbot API responses
export interface ChatbotResponse {
  output: string; // N8N returns 'output' field
  response?: string; // Fallback field name
  session_id: string;
  message_id?: string;
  timestamp?: string;
}

export type SendChatMessageResponse = ChatbotResponse;