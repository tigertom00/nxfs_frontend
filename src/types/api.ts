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
  theme: 'light' | 'dark' | 'purple' | 'pink' | 'system';
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

export interface Tag {
  id: number;
  slug: string;
  name: string;
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
  tags?: number[]; // Array of tag IDs, like categories in tasks
  meta_description?: string;
  author_id?: string;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;

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

// Tags API responses
export type GetTagsResponse = Tag[];
export type GetTagResponse = Tag;
export type CreateTagResponse = Tag;
export type UpdateTagResponse = Tag;
export type DeleteTagResponse = void;

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
export type PostYouTubeResponse = PostYouTube;
export type UploadPostYouTubeResponse = PostYouTube;

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
  status:
    | 'running'
    | 'stopped'
    | 'paused'
    | 'restarting'
    | 'exited'
    | 'created';
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

/**
 * Memo App Types - Work Order Management System
 * Based on API schema from /app/memo/ endpoints
 */

// Electrical Category (ElektriskKategori) types
export interface ElektriskKategori {
  id: number;
  blokknummer: string; // 2-digit block number (e.g., '10', '11', '12')
  kategori: string; // Category name (e.g., 'Kabler og ledninger')
  beskrivelse: string; // Detailed description and examples
  slug: string; // URL-friendly version of category name
  etim_gruppe?: string; // Related ETIM group code (e.g., 'EC000000')
  created_at: string;
  updated_at: string;
}

// Supplier (Leverandor) types - Enhanced for electrical manufacturers
export interface Supplier {
  id: number;
  name: string; // Company name (maps to 'navn' in JSON)
  telefon?: string; // Phone number
  hjemmeside?: string; // Website URL
  addresse?: string; // Address
  poststed?: string; // City/postal place
  postnummer?: string; // Postal code
  epost?: string; // Email address
  created_at: string;
  updated_at: string;
}

// Material (Matriell) types - Enhanced with electrical components data
export interface Material {
  id: number;
  leverandor: Supplier;
  leverandor_id?: number; // Foreign key to supplier
  kategori?: ElektriskKategori; // Category relationship
  kategori_id?: number; // Foreign key to category

  // Core identification - el_nr is required and unique in backend
  el_nr: string; // EL-number (electrical component number) - REQUIRED
  tittel: string; // Title - REQUIRED

  // Product details from EFO Basen JSON
  varemerke?: string; // Brand/manufacturer
  info?: string; // Technical description/ETIM info
  varenummer?: string; // Product number
  gtin_number?: string; // GTIN/EAN code

  // Descriptions
  teknisk_beskrivelse?: string; // Detailed technical description
  varebetegnelse?: string; // Product designation

  // Dimensions (using DecimalField for precise measurements)
  hoyde?: number; // Height in mm
  bredde?: number; // Width in mm
  lengde?: number; // Length/depth in mm
  vekt?: number; // Weight in grams

  // Documents and media
  bilder?: string[]; // Array of image URLs
  produktblad?: string; // Product datasheet URL
  produkt_url?: string; // Manufacturer product page URL
  fdv?: string; // FDV document URL
  cpr_sertifikat?: string; // CPR certificate URL
  miljoinformasjon?: string; // Environmental information URL

  // Status flags
  approved: boolean; // Quality control approval
  discontinued: boolean; // Product lifecycle status
  in_stock: boolean; // Inventory status
  favorites: boolean; // User favorite status

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Job Material relationship types
export interface JobMaterial {
  id: number;
  matriell: Material;
  matriell_id: number;
  antall?: number;
  transf?: boolean;
  created_at: string;
  updated_at: string;
  jobb: number; // Foreign key to Job
}

// Job Image types
export interface JobImage {
  id: number;
  image: string;
  created_at: string;
  jobb: number; // Foreign key to Job
}

// Job File types
export interface JobFile {
  id: number;
  file: string;
  created_at: string;
  jobb: number; // Foreign key to Job
}

// Work Order (Jobb) types
export interface Job {
  ordre_nr: number; // Primary key - order number
  jobbmatriell?: JobMaterial[];
  images?: JobImage[];
  files?: JobFile[];
  total_hours?: number;
  tittel?: string;
  adresse?: string;
  telefon_nr?: string;
  beskrivelse?: string;
  date?: string;
  ferdig?: boolean;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

// Time Tracking (Timeliste) types
export interface TimeEntry {
  id: number;
  beskrivelse?: string;
  dato?: string;
  timer?: number;
  user: number; // Foreign key to User
  jobb: number; // Foreign key to Job
  created_at: string;
  updated_at: string;
}

/**
 * Memo App API Request/Payload Types
 */

// ElektriskKategori payloads
export interface CreateElektriskKategoriPayload {
  blokknummer: string; // 2-digit block number (required and unique)
  kategori: string; // Category name (required)
  beskrivelse: string; // Description (required)
  slug?: string; // Auto-generated if not provided
  etim_gruppe?: string; // Optional ETIM group code
}

export type UpdateElektriskKategoriPayload =
  Partial<CreateElektriskKategoriPayload>;

// Supplier payloads
export interface CreateSupplierPayload {
  name: string; // Required in backend model (maps to 'navn' in JSON)
  telefon?: string;
  hjemmeside?: string;
  addresse?: string;
  poststed?: string;
  postnummer?: string;
  epost?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

// Material payloads - Enhanced for electrical components
export interface CreateMaterialPayload {
  // Core required fields
  el_nr: string; // Required and unique
  tittel: string; // Required
  leverandor_id: number; // Foreign key to supplier
  kategori_id?: number; // Optional foreign key to category

  // Product details from EFO Basen JSON
  varemerke?: string; // Brand/manufacturer
  info?: string; // Technical description/ETIM info
  varenummer?: string; // Product number
  gtin_number?: string; // GTIN/EAN code

  // Descriptions
  teknisk_beskrivelse?: string; // Detailed technical description
  varebetegnelse?: string; // Product designation

  // Dimensions (precise measurements)
  hoyde?: number; // Height in mm
  bredde?: number; // Width in mm
  lengde?: number; // Length/depth in mm
  vekt?: number; // Weight in grams

  // Documents and media
  bilder?: string[]; // Array of image URLs
  produktblad?: string; // Product datasheet URL
  produkt_url?: string; // Manufacturer product page URL
  fdv?: string; // FDV document URL
  cpr_sertifikat?: string; // CPR certificate URL
  miljoinformasjon?: string; // Environmental information URL

  // Status flags
  approved?: boolean; // Defaults to true in backend
  discontinued?: boolean; // Defaults to false in backend
  in_stock?: boolean; // Defaults to true in backend
  favorites?: boolean; // User favorite status
}

export type UpdateMaterialPayload = Partial<CreateMaterialPayload>;

// Material Search Parameters (matching backend MatriellFilter)
export interface MaterialSearchParams {
  // Text search fields
  search?: string; // Multi-field search
  el_nr?: string;
  tittel?: string;
  varemerke?: string;
  varenummer?: string;
  gtin_number?: string;

  // Foreign key filters
  kategori?: number; // Category ID
  kategori_blokknummer?: string; // Category block number
  kategori_name?: string; // Category name
  leverandor?: number; // Supplier ID
  leverandor_name?: string; // Supplier name

  // Boolean filters
  approved?: boolean;
  discontinued?: boolean;
  in_stock?: boolean;
  favorites?: boolean;

  // Numeric range filters
  hoyde_min?: number;
  hoyde_max?: number;
  bredde_min?: number;
  bredde_max?: number;
  lengde_min?: number;
  lengde_max?: number;
  vekt_min?: number;
  vekt_max?: number;

  // Date range filters
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;

  // Pagination
  page?: number;
  page_size?: number;

  // Ordering
  ordering?: string; // e.g., "-created_at", "el_nr", "tittel"
}

// Paginated Material Response (matching backend MatriellPagination)
export interface PaginatedMaterialResponse {
  pagination: {
    count: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
    next_page?: number;
    previous_page?: number;
  };
  links: {
    next?: string;
    previous?: string;
  };
  results: Material[];
}

// Job payloads
export interface CreateJobPayload {
  ordre_nr: number;
  tittel?: string;
  adresse?: string;
  telefon_nr?: string;
  beskrivelse?: string;
  ferdig?: boolean;
  profile_picture?: File;
}

export type UpdateJobPayload = Partial<CreateJobPayload>;

// Job Material payloads
export interface CreateJobMaterialPayload {
  matriell_id: number;
  jobb: number;
  antall?: number;
  transf?: boolean;
}

export type UpdateJobMaterialPayload = Partial<CreateJobMaterialPayload>;

// Job Image payloads
export interface CreateJobImagePayload {
  image: File;
  jobb: number;
}

// Job File payloads
export interface CreateJobFilePayload {
  file: File;
  jobb: number;
}

// Time Entry payloads
export interface CreateTimeEntryPayload {
  beskrivelse?: string;
  dato?: string;
  timer?: number;
  user: number;
  jobb: number;
}

export type UpdateTimeEntryPayload = Partial<CreateTimeEntryPayload>;

/**
 * Memo App API Response Types
 */

// ElektriskKategori API responses
export type GetElektriskKategorierResponse = ElektriskKategori[];
export type GetElektriskKategoriResponse = ElektriskKategori;
export type CreateElektriskKategoriResponse = ElektriskKategori;
export type UpdateElektriskKategoriResponse = ElektriskKategori;
export type DeleteElektriskKategoriResponse = void;

// Supplier API responses
export type GetSuppliersResponse = Supplier[];
export type GetSupplierResponse = Supplier;
export type CreateSupplierResponse = Supplier;
export type UpdateSupplierResponse = Supplier;
export type DeleteSupplierResponse = void;

// Material API responses
export type GetMaterialsResponse = Material[]; // Simple list response
export type GetMaterialsPaginatedResponse = PaginatedMaterialResponse; // Paginated response
export type GetMaterialResponse = Material;
export type CreateMaterialResponse = Material;
export type UpdateMaterialResponse = Material;
export type DeleteMaterialResponse = void;

// Job API responses
export type GetJobsResponse = Job[];
export type GetJobResponse = Job;
export type CreateJobResponse = Job;
export type UpdateJobResponse = Job;
export type DeleteJobResponse = void;

// Job Material API responses
export type GetJobMaterialsResponse = JobMaterial[];
export type GetJobMaterialResponse = JobMaterial;
export type CreateJobMaterialResponse = JobMaterial;
export type UpdateJobMaterialResponse = JobMaterial;
export type DeleteJobMaterialResponse = void;

// Job Image API responses
export type GetJobImagesResponse = JobImage[];
export type GetJobImageResponse = JobImage;
export type CreateJobImageResponse = JobImage;
export type DeleteJobImageResponse = void;

// Job File API responses
export type GetJobFilesResponse = JobFile[];
export type GetJobFileResponse = JobFile;
export type CreateJobFileResponse = JobFile;
export type DeleteJobFileResponse = void;

// Time Entry API responses
export type GetTimeEntriesResponse = TimeEntry[];
export type GetTimeEntryResponse = TimeEntry;
export type CreateTimeEntryResponse = TimeEntry;
export type UpdateTimeEntryResponse = TimeEntry;
export type DeleteTimeEntryResponse = void;

/**
 * LLM Provider Types
 * Based on API response from /app/components/providers/
 */
export interface LLMProvider {
  id: number;
  name: string;
  url: string;
  description: string;
  description_nb: string;
  strengths_en: string[];
  strengths_no: string[];
  pricing: string;
  pricing_nb: string;
  icon: string | null;
  tags: number[]; // Array of tag IDs
  created_at: string;
  updated_at: string;
}

/**
 * LLM Provider API Request/Payload Types
 */
export interface CreateLLMProviderPayload {
  name: string;
  url: string;
  description: string;
  description_nb: string;
  strengths_en: string[];
  strengths_no: string[];
  pricing: string;
  pricing_nb: string;
  icon?: File | string | null;
  tag_ids: number[]; // Required field based on API response
}

export type UpdateLLMProviderPayload = Partial<CreateLLMProviderPayload>;

/**
 * LLM Provider API Response Types
 */
export type GetLLMProvidersResponse = LLMProvider[];
export type GetLLMProviderResponse = LLMProvider;
export type CreateLLMProviderResponse = LLMProvider;
export type UpdateLLMProviderResponse = LLMProvider;
export type DeleteLLMProviderResponse = void;

/**
 * System Monitoring Types
 * Based on API responses from /api/docker/system-stats/ and /api/system/dashboard/
 */

// Core system statistics
export interface SystemStats {
  id: number;
  cpu_percent: number;
  cpu_count: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  memory_total: number;
  memory_available: number;
  memory_used: number;
  memory_free: number;
  memory_percent: number;
  swap_total: number;
  swap_used: number;
  swap_free: number;
  swap_percent: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  disk_percent: number;
  network_bytes_sent: number;
  network_bytes_recv: number;
  network_packets_sent: number;
  network_packets_recv: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  disk_read_count: number;
  disk_write_count: number;
  boot_time: string;
  process_count: number;
  cpu_temperature?: number;
  timestamp: string;
}

// Host information
export interface SystemHost {
  id: number;
  name: string;
  hostname: string;
  is_local: boolean;
  is_active: boolean;
  last_seen: string;
  created_at: string;
  container_count: number;
  running_containers: number;
  cpu_cores: number;
  cpu_model: string;
  total_memory: number;
  architecture: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  latest_system_stats?: SystemStats;
}

// Top processes information
export interface TopProcess {
  id: number;
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_percent: number;
  memory_rss: number;
  memory_vms: number;
  status: string;
  create_time: string;
  cmdline: string;
  timestamp: string;
}

// Container summary for dashboard
export interface ContainersSummary {
  total: number;
  running: number;
  stopped: number;
  paused: number;
}

// Historical data points for charts
export interface CPUHistoryPoint {
  timestamp: string;
  cpu_percent: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
}

export interface MemoryHistoryPoint {
  timestamp: string;
  memory_percent: number;
  memory_used: number;
  memory_available: number;
  swap_percent: number;
}

export interface DiskHistoryPoint {
  timestamp: string;
  disk_percent: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}

export interface NetworkHistoryPoint {
  timestamp: string;
  network_bytes_sent: number;
  network_bytes_recv: number;
}

// Combined dashboard data structure
export interface SystemDashboard {
  host: SystemHost;
  current_system_stats: SystemStats;
  containers_summary: ContainersSummary;
  top_processes: TopProcess[];
  cpu_history: CPUHistoryPoint[];
  memory_history: MemoryHistoryPoint[];
  disk_history: DiskHistoryPoint[];
  network_history: NetworkHistoryPoint[];
}

// Latest system stats response (multi-host)
export interface LatestSystemStatsItem {
  host: SystemHost;
  stats: SystemStats;
}

export interface LatestSystemStatsResponse {
  count: number;
  results: LatestSystemStatsItem[];
}

/**
 * System Monitoring API Response Types
 */

// System stats endpoints
export type GetSystemStatsResponse = SystemStats[];
export type GetSystemStatResponse = SystemStats;
export type GetLatestSystemStatsResponse = LatestSystemStatsResponse;

// Dashboard endpoints
export type GetSystemDashboardResponse = SystemDashboard;
export type GetHostSystemDashboardResponse = SystemDashboard;

// Collection endpoints
export interface CollectSystemStatsResponse {
  message: string;
  collected_hosts: number;
  timestamp: string;
}

export type PostSystemCollectResponse = CollectSystemStatsResponse;
