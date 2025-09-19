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
  language: 'en' | 'no';
  dark_mode: boolean;
  session_id?: string; // For chatbot session management
}

/**
 * Task-related types - matching your existing API structure
 * Using the same types as defined in types/task.ts for consistency
 */
export interface TaskImage {
  id: string;
  image: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
}

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
  images?: TaskImage[]; // Array of uploaded images
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  name_nb?: string;
}

export interface ProjectImage {
  id: string;
  image: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
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
  images?: ProjectImage[]; // Array of uploaded images
}

/**
 * Post types for blog functionality
 */
export interface PostAudio {
  id: string;
  audio: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
  duration?: number;
}

export interface PostImage {
  id: string;
  image: string;
  upload_date: string;
  file_size?: number;
  file_name?: string;
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
  slug: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags?: string[];
  meta_description?: string;
  audio?: PostAudio[]; // Array of uploaded audio files
  images?: PostImage[]; // Array of uploaded images
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

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

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
export type UploadTaskImageResponse = TaskImage;
export type DeleteTaskImageResponse = void;

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
export type UploadProjectImageResponse = ProjectImage;
export type DeleteProjectImageResponse = void;

// Posts API responses
export type GetPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPublicPostsResponse = Post[] | PaginatedResponse<Post>;
export type GetPostResponse = Post;
export type CreatePostResponse = Post;
export type UpdatePostResponse = Post;
export type DeletePostResponse = void;
export type UploadPostAudioResponse = PostAudio;
export type DeletePostAudioResponse = void;
export type UploadPostImageResponse = PostImage;
export type DeletePostImageResponse = void;

// Chatbot API responses
export interface ChatbotResponse {
  output: string; // N8N returns 'output' field
  response?: string; // Fallback field name
  session_id: string;
  message_id?: string;
  timestamp?: string;
}

export type SendChatMessageResponse = ChatbotResponse;

/**
 * Docker-related types for container management
 */
export interface DockerHost {
  id: number;
  name: string;
  hostname: string;
  ip_address?: string;
  port?: number;
  connection_type?: 'socket' | 'tcp';
  is_active: boolean;
  last_sync?: string;
  total_containers?: number;
  running_containers?: number;
  created_at: string;
  updated_at: string;
}

export interface DockerContainer {
  id: string;
  container_id: string; // Docker container ID
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'exited' | 'created';
  state: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
  };
  host: number; // Foreign key to DockerHost
  host_name?: string; // Host name for display
  created_at: string;
  started_at?: string;
  ports?: Array<{
    container_port: number;
    host_ip?: string;
    host_port?: number;
  }>;
  networks?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  labels?: Record<string, string>;
  command?: string;
  updated_at: string;
  latest_stats?: DockerStats;
}

export interface DockerStats {
  id: string;
  container: string; // Foreign key to DockerContainer
  timestamp: string;
  cpu_percent: number;
  memory_usage: number; // in bytes
  memory_limit: number; // in bytes
  memory_percent: number;
  network_rx: number; // bytes received
  network_tx: number; // bytes transmitted
  disk_read: number; // bytes read from disk
  disk_write: number; // bytes written to disk
  pids: number; // number of processes/threads
}

export interface DockerOverview {
  total_hosts: number;
  total_containers: number;
  running_containers: number;
  stopped_containers: number;
  hosts: DockerHost[];
}

/**
 * Docker API response types
 */
export type GetDockerHostsResponse = DockerHost[];
export type GetDockerHostResponse = DockerHost;
export type GetDockerOverviewResponse = DockerOverview;

export type GetDockerContainersResponse = DockerContainer[];
export type GetDockerContainerResponse = DockerContainer;
export type GetRunningContainersResponse = DockerContainer[];

export type GetContainerStatsResponse = DockerStats[];

export interface SyncContainersResponse {
  message: string;
  synced_containers: number;
  timestamp: string;
}

export interface RefreshStatsResponse {
  message: string;
  containers_updated: number;
  timestamp: string;
}