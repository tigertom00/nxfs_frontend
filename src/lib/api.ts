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
  CreateTaskPayload,
  UpdateTaskPayload,
  UploadTaskImageResponse,
  DeleteTaskImageResponse,
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
  UploadProjectImageResponse,
  DeleteProjectImageResponse,
  GetPostsResponse,
  GetPublicPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  DeletePostResponse,
  CreatePostPayload,
  UpdatePostPayload,
  UploadPostAudioResponse,
  DeletePostAudioResponse,
  UploadPostImageResponse,
  DeletePostImageResponse,
  SendChatMessageResponse,
  GetDockerHostsResponse,
  GetDockerHostResponse,
  GetDockerContainersResponse,
  GetDockerContainerResponse,
  GetRunningContainersResponse,
  GetContainerStatsResponse,
  SyncContainersResponse,
  RefreshStatsResponse,
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
            `${env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
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
      !originalRequest.url?.includes('/auth/token/refresh/') &&
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
    const response = await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/token/`, {
      email,
      password,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await axios.post(
      `${env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
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
    const response = await api.get('/api/user/');
    return response.data;
  },

  updateUser: async (
    userId: string,
    userData: Partial<UpdateUserResponse>
  ): Promise<UpdateUserResponse> => {
    const response = await api.put(`/api/user/${userId}/`, userData);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    const response = await api.delete(`/api/user/${userId}/`);
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getPublicPosts: async (): Promise<GetPublicPostsResponse> => {
    const response = await api.get('/app/blog/posts/public/');
    return response.data;
  },

  getPosts: async (): Promise<GetPostsResponse> => {
    const response = await api.get('/app/blog/posts/');
    return response.data;
  },

  getPost: async (postId: string): Promise<GetPostResponse> => {
    const response = await api.get(`/app/blog/posts/${postId}/`);
    return response.data;
  },

  createPost: async (
    postData: CreatePostPayload
  ): Promise<CreatePostResponse> => {
    const response = await api.post('/app/blog/posts/', postData);
    return response.data;
  },

  updatePost: async (
    postId: string,
    postData: UpdatePostPayload
  ): Promise<UpdatePostResponse> => {
    const response = await api.put(`/app/blog/posts/${postId}/`, postData);
    return response.data;
  },

  deletePost: async (postId: string): Promise<DeletePostResponse> => {
    const response = await api.delete(`/app/blog/posts/${postId}/`);
    return response.data;
  },

  uploadAudio: async (postId: string, audio: File): Promise<UploadPostAudioResponse> => {
    try {
      const formData = new FormData();
      formData.append('audio', audio);

      const response = await api.post(`/app/blog/posts/${postId}/audio/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Audio uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading post audio');
      throw error;
    }
  },

  deleteAudio: async (postId: string, audioId: string): Promise<DeletePostAudioResponse> => {
    try {
      const response = await api.delete(`/app/blog/posts/${postId}/audio/${audioId}/`);
      showSuccessToast('Audio deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting post audio');
      throw error;
    }
  },

  uploadImage: async (postId: string, image: File): Promise<UploadPostImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(`/app/blog/posts/${postId}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading post image');
      throw error;
    }
  },

  deleteImage: async (postId: string, imageId: string): Promise<DeletePostImageResponse> => {
    try {
      const response = await api.delete(`/app/blog/posts/${postId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting post image');
      throw error;
    }
  },
};

// N8N Chatbot API
export const chatbotAPI = {
  sendMessage: async (
    sessionId: string,
    chatInput: string,
    userName?: string
  ): Promise<SendChatMessageResponse> => {
    const accessToken = getAccessToken();
    const response = await axios.post(
      env.NEXT_PUBLIC_N8N_URL,
      {
        sessionId,
        action: 'sendMessage',
        chatInput,
        accessToken,
        userName,
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
    files?: File[],
    userName?: string
  ): Promise<SendChatMessageResponse> => {
    const accessToken = getAccessToken();
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('action', 'sendMessage');
    formData.append('chatInput', chatInput);
    if (accessToken) {
      formData.append('accessToken', accessToken);
    }
    if (userName) {
      formData.append('userName', userName);
    }

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
    const response = await api.get('/app/tasks/tasks/');
    // Handle both paginated and array responses
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  getTask: async (taskId: string): Promise<GetTaskResponse> => {
    const response = await api.get(`/app/tasks/tasks/${taskId}/`);
    return response.data;
  },

  createTask: async (
    taskData: CreateTaskPayload
  ): Promise<CreateTaskResponse> => {
    try {
      const formData = new FormData();

      // Convert task data to FormData for multipart/form-data submission
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array fields like category - Django expects repeated field names
            value.forEach((item) => {
              formData.append(key, item.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post('/app/tasks/tasks/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      const formData = new FormData();

      // Convert task data to FormData for multipart/form-data submission
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array fields like category - Django expects repeated field names
            value.forEach((item) => {
              formData.append(key, item.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.put(`/app/tasks/tasks/${taskId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      const formData = new FormData();

      // Convert task data to FormData for multipart/form-data submission
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array fields like category - Django expects repeated field names
            value.forEach((item) => {
              formData.append(key, item.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.patch(`/app/tasks/tasks/${taskId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating task');
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<DeleteTaskResponse> => {
    try {
      const response = await api.delete(`/app/tasks/tasks/${taskId}/`);
      showSuccessToast('Task deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting task');
      throw error;
    }
  },

  uploadImage: async (taskId: string, image: File): Promise<UploadTaskImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(`/app/tasks/tasks/${taskId}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading task image');
      throw error;
    }
  },

  deleteImage: async (taskId: string, imageId: string): Promise<DeleteTaskImageResponse> => {
    try {
      const response = await api.delete(`/app/tasks/tasks/${taskId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting task image');
      throw error;
    }
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<GetCategoriesResponse> => {
    const response = await api.get('/app/tasks/categories/');
    // Handle both paginated and array responses
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
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
    const response = await api.get('/app/tasks/projects/');
    // Handle both paginated and array responses
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
  },
  getProject: async (projectId: string): Promise<GetProjectResponse> => {
    const response = await api.get(`/app/tasks/projects/${projectId}/`);
    return response.data;
  },
  createProject: async (
    projectData: Partial<Project>
  ): Promise<CreateProjectResponse> => {
    try {
      const formData = new FormData();

      // Convert project data to FormData for multipart/form-data submission
      Object.entries(projectData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array fields like tasks
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post('/app/tasks/projects/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Project created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating project');
      throw error;
    }
  },
  updateProject: async (
    projectId: string,
    projectData: Partial<Project>
  ): Promise<UpdateProjectResponse> => {
    try {
      const formData = new FormData();

      // Convert project data to FormData for multipart/form-data submission
      Object.entries(projectData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array fields like tasks
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.put(`/app/tasks/projects/${projectId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Project updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating project');
      throw error;
    }
  },
  deleteProject: async (projectId: string): Promise<DeleteProjectResponse> => {
    const response = await api.delete(`/app/tasks/projects/${projectId}/`);
    return response.data;
  },

  uploadImage: async (projectId: string, image: File): Promise<UploadProjectImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(`/app/tasks/projects/${projectId}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading project image');
      throw error;
    }
  },

  deleteImage: async (projectId: string, imageId: string): Promise<DeleteProjectImageResponse> => {
    try {
      const response = await api.delete(`/app/tasks/projects/${projectId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting project image');
      throw error;
    }
  },
};

// Docker API
export const dockerAPI = {
  // Host management
  getHosts: async (): Promise<GetDockerHostsResponse> => {
    const response = await api.get('/api/docker/hosts/');
    return response.data;
  },

  getHost: async (hostId: number): Promise<GetDockerHostResponse> => {
    const response = await api.get(`/api/docker/hosts/${hostId}/`);
    return response.data;
  },


  syncContainers: async (hostId: number): Promise<SyncContainersResponse> => {
    try {
      const response = await api.post(`/api/docker/hosts/${hostId}/sync_containers/`);
      showSuccessToast('Container sync initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Syncing containers');
      throw error;
    }
  },

  // Container management
  getContainers: async (params?: {
    host_id?: number;
    status?: string;
    running_only?: boolean;
  }): Promise<GetDockerContainersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.host_id) queryParams.append('host_id', params.host_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.running_only) queryParams.append('running_only', 'true');

    const response = await api.get(`/api/docker/containers/?${queryParams.toString()}`);
    return response.data;
  },

  getContainer: async (containerId: string): Promise<GetDockerContainerResponse> => {
    const response = await api.get(`/api/docker/containers/${containerId}/`);
    return response.data;
  },

  getRunningContainers: async (): Promise<GetRunningContainersResponse> => {
    const response = await api.get('/api/docker/containers/running/');
    return response.data;
  },

  getContainerStats: async (
    containerId: string,
    params?: { hours?: number; limit?: number }
  ): Promise<GetContainerStatsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.hours) queryParams.append('hours', params.hours.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(
      `/api/docker/containers/${containerId}/stats/?${queryParams.toString()}`
    );
    return response.data;
  },

  refreshStats: async (): Promise<RefreshStatsResponse> => {
    try {
      const response = await api.post('/api/docker/containers/refresh_stats/');
      showSuccessToast('Stats refresh initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Refreshing container stats');
      throw error;
    }
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
