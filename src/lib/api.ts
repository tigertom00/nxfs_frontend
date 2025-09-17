import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { handleApiError, showSuccessToast } from './error-handler';
import { env } from './env';
import type {
  LoginResponse,
  RefreshTokenResponse,
  GetCurrentUserResponse,
  UpdateUserResponse,
  GetTasksResponse,
  GetTaskResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  GetProjectsResponse,
  GetProjectResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  GetPostsResponse,
  GetPublicPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  DeletePostResponse,
  SendChatMessageResponse,
  Task,
  Category,
  Project,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('Request error:', error.response?.data);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Use a separate axios instance for refresh to avoid circular interceptor calls
          const refreshResponse = await axios.post(
            `${env.NEXT_PUBLIC_API_URL}/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                // Some APIs expect the refresh token in Authorization header
                // Remove this line if your API doesn't require it
                // Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          const { access, refresh } = refreshResponse.data;
          localStorage.setItem('accessToken', access);

          // Update refresh token if provided (some APIs return a new refresh token)
          if (refresh) {
            localStorage.setItem('refreshToken', refresh);
          }

          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          // No refresh token available, clear everything
          console.log('No refresh token available, redirecting to login.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/';
          return Promise.reject(new Error('No refresh token available'));
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // Only show error toast if it's not a 401/403 that we just handled with token refresh
    // or if it's a token refresh request itself that failed
    if (
      !originalRequest.url?.includes('/token/refresh/') &&
      !(error.response?.status === 401 || error.response?.status === 403)
    ) {
      handleApiError(
        error,
        `API ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`
      );
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${env.NEXT_PUBLIC_API_URL}/token/`, {
      email,
      password,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await axios.post(
      `${env.NEXT_PUBLIC_API_URL}/token/refresh/`,
      {
        refresh: refreshToken,
      }
    );
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    const response = await api.get('/user/');
    return response.data;
  },

  updateUser: async (
    userId: string,
    userData: Partial<UpdateUserResponse>
  ): Promise<UpdateUserResponse> => {
    const response = await api.put(`/user/${userId}/`, userData);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    const response = await api.delete(`/user/${userId}/`);
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getPublicPosts: async (): Promise<GetPublicPostsResponse> => {
    const response = await api.get('/api/posts/public/');
    return response.data;
  },

  getPosts: async (): Promise<GetPostsResponse> => {
    const response = await api.get('/api/posts/');
    return response.data;
  },

  getPost: async (postId: string): Promise<GetPostResponse> => {
    const response = await api.get(`/api/posts/${postId}/`);
    return response.data;
  },

  createPost: async (
    postData: Partial<CreatePostResponse>
  ): Promise<CreatePostResponse> => {
    const response = await api.post('/api/posts/', postData);
    return response.data;
  },

  updatePost: async (
    postId: string,
    postData: Partial<UpdatePostResponse>
  ): Promise<UpdatePostResponse> => {
    const response = await api.put(`/api/posts/${postId}/`, postData);
    return response.data;
  },

  deletePost: async (postId: string): Promise<DeletePostResponse> => {
    const response = await api.delete(`/api/posts/${postId}/`);
    return response.data;
  },
};

// N8N Chatbot API
export const chatbotAPI = {
  sendMessage: async (
    sessionId: string,
    chatInput: string
  ): Promise<SendChatMessageResponse> => {
    const response = await axios.post(
      env.NEXT_PUBLIC_N8N_URL,
      {
        sessionId,
        action: 'sendMessage',
        chatInput,
      },
      {
        headers: {
          Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  sendMessageWithFiles: async (
    sessionId: string,
    chatInput: string,
    files?: File[]
  ): Promise<SendChatMessageResponse> => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('action', 'sendMessage');
    formData.append('chatInput', chatInput);

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    const response = await axios.post(env.NEXT_PUBLIC_N8N_URL, formData, {
      headers: {
        Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (): Promise<GetTasksResponse> => {
    const response = await api.get('/app/tasks/');
    return response.data;
  },

  getTask: async (taskId: string): Promise<GetTaskResponse> => {
    const response = await api.get(`/app/tasks/${taskId}/`);
    return response.data;
  },

  createTask: async (
    taskData: CreateTaskPayload
  ): Promise<CreateTaskResponse> => {
    try {
      const response = await api.post('/app/tasks/', taskData);
      showSuccessToast('Task created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating task');
      throw error;
    }
  },

  updateTask: async (
    taskId: string,
    taskData: UpdateTaskPayload
  ): Promise<UpdateTaskResponse> => {
    try {
      const response = await api.put(`/app/tasks/${taskId}/`, taskData);
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating task');
      throw error;
    }
  },

  patchTask: async (
    taskId: string,
    taskData: UpdateTaskPayload
  ): Promise<UpdateTaskResponse> => {
    try {
      const response = await api.patch(`/app/tasks/${taskId}/`, taskData);
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating task');
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<DeleteTaskResponse> => {
    try {
      const response = await api.delete(`/app/tasks/${taskId}/`);
      showSuccessToast('Task deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting task');
      throw error;
    }
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<GetCategoriesResponse> => {
    const response = await api.get('/app/tasks/categories/');
    return response.data;
  },
  getCategory: async (categoryId: string): Promise<GetCategoryResponse> => {
    const response = await api.get(`/app/tasks/categories/${categoryId}/`);
    return response.data;
  },
  createCategory: async (
    categoryData: Partial<Category>
  ): Promise<CreateCategoryResponse> => {
    const response = await api.post('/app/tasks/categories/', categoryData);
    return response.data;
  },
  updateCategory: async (
    categoryId: string,
    categoryData: Partial<Category>
  ): Promise<UpdateCategoryResponse> => {
    const response = await api.put(
      `/app/tasks/categories/${categoryId}/`,
      categoryData
    );
    return response.data;
  },
  deleteCategory: async (
    categoryId: string
  ): Promise<DeleteCategoryResponse> => {
    const response = await api.delete(`/app/tasks/categories/${categoryId}/`);
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async (): Promise<GetProjectsResponse> => {
    const response = await api.get('/app/projects/');
    return response.data;
  },
  getProject: async (projectId: string): Promise<GetProjectResponse> => {
    const response = await api.get(`/app/projects/${projectId}/`);
    return response.data;
  },
  createProject: async (
    projectData: Partial<Project>
  ): Promise<CreateProjectResponse> => {
    const response = await api.post('/app/projects/', projectData);
    return response.data;
  },
  updateProject: async (
    projectId: string,
    projectData: Partial<Project>
  ): Promise<UpdateProjectResponse> => {
    const response = await api.put(`/app/projects/${projectId}/`, projectData);
    return response.data;
  },
  deleteProject: async (projectId: string): Promise<DeleteProjectResponse> => {
    const response = await api.delete(`/app/projects/${projectId}/`);
    return response.data;
  },
};

// Utility functions
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export default api;
