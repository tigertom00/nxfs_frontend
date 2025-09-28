import { PaginatedResponse, BaseSearchParams } from '../shared/types';

// Task entity types
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
  description?: string;
  color?: string;
  task_count?: number;
  created_at: string;
  updated_at: string;
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

// Request payload types
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

export interface CreateCategoryPayload {
  name: string;
  name_nb?: string;
  slug: string;
  description?: string;
  color?: string;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreateProjectPayload {
  name: string;
  name_nb?: string;
  description?: string;
  description_nb?: string;
  user_id: number;
  status?: 'todo' | 'in_progress' | 'completed';
  tasks?: number[];
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

// Search and filter types
export interface TaskSearchParams extends BaseSearchParams {
  status?: 'todo' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: number[];
  project?: number;
  user_id?: string;
  due_date_before?: string;
  due_date_after?: string;
  completed?: boolean;
}

export interface ProjectSearchParams extends BaseSearchParams {
  status?: 'todo' | 'in_progress' | 'completed';
  user_id?: number;
  completed?: boolean;
  has_tasks?: boolean;
}

export interface CategorySearchParams extends BaseSearchParams {
  has_tasks?: boolean;
}

// Response types
export type GetTasksResponse = Task[] | PaginatedResponse<Task>;
export type GetTaskResponse = Task;
export type CreateTaskResponse = Task;
export type UpdateTaskResponse = Task;
export type DeleteTaskResponse = void;
export type UploadTaskImageResponse = TaskImage;
export type DeleteTaskImageResponse = void;

export type GetCategoriesResponse = Category[];
export type GetCategoryResponse = Category;
export type CreateCategoryResponse = Category;
export type UpdateCategoryResponse = Category;
export type DeleteCategoryResponse = void;

export type GetProjectsResponse = Project[] | PaginatedResponse<Project>;
export type GetProjectResponse = Project;
export type CreateProjectResponse = Project;
export type UpdateProjectResponse = Project;
export type DeleteProjectResponse = void;
export type UploadProjectImageResponse = ProjectImage;
export type DeleteProjectImageResponse = void;