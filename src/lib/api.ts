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
  // Memo app types
  Supplier,
  Material,
  Job,
  JobMaterial,
  JobImage,
  JobFile,
  TimeEntry,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  CreateMaterialPayload,
  UpdateMaterialPayload,
  CreateJobPayload,
  UpdateJobPayload,
  CreateJobMaterialPayload,
  UpdateJobMaterialPayload,
  CreateJobImagePayload,
  CreateJobFilePayload,
  CreateTimeEntryPayload,
  UpdateTimeEntryPayload,
  GetSuppliersResponse,
  GetSupplierResponse,
  CreateSupplierResponse,
  UpdateSupplierResponse,
  DeleteSupplierResponse,
  GetMaterialsResponse,
  GetMaterialResponse,
  CreateMaterialResponse,
  UpdateMaterialResponse,
  DeleteMaterialResponse,
  GetJobsResponse,
  GetJobResponse,
  CreateJobResponse,
  UpdateJobResponse,
  DeleteJobResponse,
  GetJobMaterialsResponse,
  GetJobMaterialResponse,
  CreateJobMaterialResponse,
  UpdateJobMaterialResponse,
  DeleteJobMaterialResponse,
  GetJobImagesResponse,
  GetJobImageResponse,
  CreateJobImageResponse,
  DeleteJobImageResponse,
  GetJobFilesResponse,
  GetJobFileResponse,
  CreateJobFileResponse,
  DeleteJobFileResponse,
  GetTimeEntriesResponse,
  GetTimeEntryResponse,
  CreateTimeEntryResponse,
  UpdateTimeEntryResponse,
  DeleteTimeEntryResponse,
  // LLM Provider types
  LLMProvider,
  CreateLLMProviderPayload,
  UpdateLLMProviderPayload,
  GetLLMProvidersResponse,
  GetLLMProviderResponse,
  CreateLLMProviderResponse,
  UpdateLLMProviderResponse,
  DeleteLLMProviderResponse,
  // System monitoring types
  GetSystemStatsResponse,
  GetSystemStatResponse,
  GetLatestSystemStatsResponse,
  GetSystemDashboardResponse,
  GetHostSystemDashboardResponse,
  PostSystemCollectResponse,
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
    const response = await axios.post(
      `${env.NEXT_PUBLIC_API_URL}/auth/token/`,
      {
        email,
        password,
      }
    );
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

  getPostBySlug: async (slug: string): Promise<GetPostResponse> => {
    const response = await api.get(`/app/blog/slug/${slug}/`);
    return response.data;
  },

  createPost: async (
    postData: CreatePostPayload
  ): Promise<CreatePostResponse> => {
    try {
      // First try JSON payload for better compatibility with HTML content
      const response = await api.post('/app/blog/posts/', postData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      showSuccessToast('Post created successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON create failed, trying FormData:', jsonError);

      // If it's a validation error, don't try FormData fallback - just throw the error
      if (jsonError.response?.status === 400) {
        console.log(
          'Validation error from JSON request:',
          jsonError.response.data
        );
        throw jsonError;
      }

      // Fallback to FormData if JSON fails for other reasons
      try {
        const formData = new FormData();
        // Convert post data to FormData for multipart/form-data submission
        Object.entries(postData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle array fields like tags - Django expects repeated field names
              value.forEach((item) => {
                formData.append(key, item.toString());
              });
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        const response = await api.post('/app/blog/posts/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showSuccessToast('Post created successfully');
        return response.data;
      } catch (error) {
        console.log('FormData create error:', error);
        throw error;
      }
    }
  },

  updatePost: async (
    postId: string,
    postData: UpdatePostPayload
  ): Promise<UpdatePostResponse> => {
    try {
      // First try JSON payload for better compatibility with HTML content
      const response = await api.put(`/app/blog/posts/${postId}/`, postData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      showSuccessToast('Post updated successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON update failed, trying FormData:', jsonError);

      // If it's a validation error, don't try FormData fallback - just throw the error
      if (jsonError.response?.status === 400) {
        console.log(
          'Validation error from JSON request:',
          jsonError.response.data
        );
        throw jsonError;
      }

      // Fallback to FormData if JSON fails for other reasons
      try {
        const formData = new FormData();
        // Convert post data to FormData for multipart/form-data submission
        Object.entries(postData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle array fields like tags - Django expects repeated field names
              value.forEach((item) => {
                formData.append(key, item.toString());
              });
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        const response = await api.put(`/app/blog/posts/${postId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showSuccessToast('Post updated successfully');
        return response.data;
      } catch (error) {
        console.log('FormData update error:', error);
        throw error;
      }
    }
  },

  deletePost: async (postId: string): Promise<DeletePostResponse> => {
    const response = await api.delete(`/app/blog/posts/${postId}/`);
    return response.data;
  },

  getImages: async (postId: string): Promise<UploadPostImageResponse[]> => {
    const response = await api.get(`/app/blog/posts/${postId}/images/`);
    return response.data;
  },

  getAudio: async (postId: string): Promise<UploadPostAudioResponse[]> => {
    const response = await api.get(`/app/blog/posts/${postId}/audio/`);
    return response.data;
  },

  uploadAudio: async (
    postId: string,
    audio: File
  ): Promise<UploadPostAudioResponse> => {
    try {
      const formData = new FormData();
      formData.append('audio', audio);

      const response = await api.post(
        `/app/blog/posts/${postId}/audio/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Audio uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading post audio');
      throw error;
    }
  },

  deleteAudio: async (
    postId: string,
    audioId: string
  ): Promise<DeletePostAudioResponse> => {
    try {
      const response = await api.delete(
        `/app/blog/posts/${postId}/audio/${audioId}/`
      );
      showSuccessToast('Audio deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting post audio');
      throw error;
    }
  },

  uploadImage: async (
    postId: string,
    image: File
  ): Promise<UploadPostImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(
        `/app/blog/posts/${postId}/images/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading post image');
      throw error;
    }
  },

  deleteImage: async (
    postId: string,
    imageId: string
  ): Promise<DeletePostImageResponse> => {
    try {
      const response = await api.delete(
        `/app/blog/posts/${postId}/images/${imageId}/`
      );
      showSuccessToast('Image deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting post image');
      throw error;
    }
  },

  getYouTubeVideos: async (postId: string): Promise<PostYouTubeResponse[]> => {
    const response = await api.get(`/app/blog/posts/${postId}/youtube/`);
    return response.data;
  },

  uploadYouTube: async (
    postId: string,
    url: string,
    title?: string
  ): Promise<PostYouTubeResponse> => {
    try {
      const formData = new FormData();
      formData.append('url', url);
      if (title) {
        formData.append('title', title);
      }

      const response = await api.post(
        `/app/blog/posts/${postId}/youtube/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('YouTube video added successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Adding YouTube video');
      throw error;
    }
  },

  deleteYouTube: async (postId: string, youtubeId: string): Promise<void> => {
    try {
      const response = await api.delete(
        `/app/blog/posts/${postId}/youtube/${youtubeId}/`
      );
      showSuccessToast('YouTube video deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting YouTube video');
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

      const response = await api.patch(
        `/app/tasks/tasks/${taskId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
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

  uploadImage: async (
    taskId: string,
    image: File
  ): Promise<UploadTaskImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(
        `/app/tasks/tasks/${taskId}/upload_image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading task image');
      throw error;
    }
  },

  deleteImage: async (
    taskId: string,
    imageId: string
  ): Promise<DeleteTaskImageResponse> => {
    try {
      const response = await api.delete(
        `/app/tasks/tasks/${taskId}/images/${imageId}/`
      );
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

      const response = await api.put(
        `/app/tasks/projects/${projectId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
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

  uploadImage: async (
    projectId: string,
    image: File
  ): Promise<UploadProjectImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(
        `/app/tasks/projects/${projectId}/upload_image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading project image');
      throw error;
    }
  },

  deleteImage: async (
    projectId: string,
    imageId: string
  ): Promise<DeleteProjectImageResponse> => {
    try {
      const response = await api.delete(
        `/app/tasks/projects/${projectId}/images/${imageId}/`
      );
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
      const response = await api.post(
        `/api/docker/hosts/${hostId}/sync_containers/`
      );
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
    if (params?.host_id)
      queryParams.append('host_id', params.host_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.running_only) queryParams.append('running_only', 'true');

    const response = await api.get(
      `/api/docker/containers/?${queryParams.toString()}`
    );
    return response.data;
  },

  getContainer: async (
    containerId: string
  ): Promise<GetDockerContainerResponse> => {
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

// Tags API - for blog tags management
export const tagsAPI = {
  getTags: async (): Promise<GetTagsResponse> => {
    const response = await api.get('/app/blog/tags/');
    // Handle both paginated and array responses
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  getTag: async (tagId: string): Promise<GetTagResponse> => {
    const response = await api.get(`/app/blog/tags/${tagId}/`);
    return response.data;
  },

  createTag: async (tagData: Partial<Tag>): Promise<CreateTagResponse> => {
    try {
      const response = await api.post('/app/blog/tags/', tagData);
      showSuccessToast('Tag created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating tag');
      throw error;
    }
  },

  updateTag: async (
    tagId: string,
    tagData: Partial<Tag>
  ): Promise<UpdateTagResponse> => {
    try {
      const response = await api.put(`/app/blog/tags/${tagId}/`, tagData);
      showSuccessToast('Tag updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating tag');
      throw error;
    }
  },

  deleteTag: async (tagId: string): Promise<DeleteTagResponse> => {
    try {
      const response = await api.delete(`/app/blog/tags/${tagId}/`);
      showSuccessToast('Tag deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting tag');
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

// Memo App APIs - Work Order Management System

// Suppliers API (Leverandorer)
export const suppliersAPI = {
  getSuppliers: async (): Promise<GetSuppliersResponse> => {
    const response = await api.get('/app/memo/leverandorer/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getSupplier: async (supplierId: number): Promise<GetSupplierResponse> => {
    const response = await api.get(`/app/memo/leverandorer/${supplierId}/`);
    return response.data;
  },

  createSupplier: async (
    supplierData: CreateSupplierPayload
  ): Promise<CreateSupplierResponse> => {
    try {
      const response = await api.post('/app/memo/leverandorer/', supplierData);
      showSuccessToast('Supplier created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating supplier');
      throw error;
    }
  },

  updateSupplier: async (
    supplierId: number,
    supplierData: UpdateSupplierPayload
  ): Promise<UpdateSupplierResponse> => {
    try {
      const response = await api.put(
        `/app/memo/leverandorer/${supplierId}/`,
        supplierData
      );
      showSuccessToast('Supplier updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating supplier');
      throw error;
    }
  },

  deleteSupplier: async (
    supplierId: number
  ): Promise<DeleteSupplierResponse> => {
    try {
      const response = await api.delete(
        `/app/memo/leverandorer/${supplierId}/`
      );
      showSuccessToast('Supplier deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting supplier');
      throw error;
    }
  },
};

// Materials API (Matriell)
export const materialsAPI = {
  getMaterials: async (): Promise<GetMaterialsResponse> => {
    const response = await api.get('/app/memo/matriell/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getMaterial: async (materialId: number): Promise<GetMaterialResponse> => {
    const response = await api.get(`/app/memo/matriell/${materialId}/`);
    return response.data;
  },

  createMaterial: async (
    materialData: CreateMaterialPayload
  ): Promise<CreateMaterialResponse> => {
    try {
      const formData = new FormData();
      Object.entries(materialData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post('/app/memo/matriell/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Material created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating material');
      throw error;
    }
  },

  updateMaterial: async (
    materialId: number,
    materialData: UpdateMaterialPayload
  ): Promise<UpdateMaterialResponse> => {
    try {
      const formData = new FormData();
      Object.entries(materialData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.put(
        `/app/memo/matriell/${materialId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Material updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating material');
      throw error;
    }
  },

  deleteMaterial: async (
    materialId: number
  ): Promise<DeleteMaterialResponse> => {
    try {
      const response = await api.delete(`/app/memo/matriell/${materialId}/`);
      showSuccessToast('Material deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting material');
      throw error;
    }
  },
  toggleFavorite: async (
    materialId: number
  ): Promise<UpdateMaterialResponse> => {
    try {
      const response = await api.patch(
        `/app/memo/matriell/${materialId}/favorite/`
      );
      showSuccessToast('Material favorite status updated');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating material favorite status');
      throw error;
    }
  },
};

// Jobs API (Jobber)
export const jobsAPI = {
  getJobs: async (): Promise<GetJobsResponse> => {
    const response = await api.get('/app/memo/jobber/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getJob: async (orderNumber: number): Promise<GetJobResponse> => {
    const response = await api.get(`/app/memo/jobber/${orderNumber}/`);
    return response.data;
  },

  createJob: async (jobData: CreateJobPayload): Promise<CreateJobResponse> => {
    try {
      // Try JSON first for simple data
      const response = await api.post('/app/memo/jobber/', jobData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      showSuccessToast('Job created successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON create failed, trying FormData:', jsonError);

      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        jobData.profile_picture instanceof File
      ) {
        try {
          const formData = new FormData();
          Object.entries(jobData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (value instanceof File) {
                formData.append(key, value);
              } else {
                formData.append(key, value.toString());
              }
            }
          });

          const response = await api.post('/app/memo/jobber/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          showSuccessToast('Job created successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Creating job');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Creating job');
        throw jsonError;
      }
    }
  },

  updateJob: async (
    orderNumber: number,
    jobData: UpdateJobPayload
  ): Promise<UpdateJobResponse> => {
    try {
      // Try JSON first for simple data
      const response = await api.put(
        `/app/memo/jobber/${orderNumber}/`,
        jobData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      showSuccessToast('Job updated successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON update failed, trying FormData:', jsonError);

      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        jobData.profile_picture instanceof File
      ) {
        try {
          const formData = new FormData();
          Object.entries(jobData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (value instanceof File) {
                formData.append(key, value);
              } else {
                formData.append(key, value.toString());
              }
            }
          });

          const response = await api.put(
            `/app/memo/jobber/${orderNumber}/`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          showSuccessToast('Job updated successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Updating job');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Updating job');
        throw jsonError;
      }
    }
  },

  deleteJob: async (orderNumber: number): Promise<DeleteJobResponse> => {
    try {
      const response = await api.delete(`/app/memo/jobber/${orderNumber}/`);
      showSuccessToast('Job deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting job');
      throw error;
    }
  },
};

// Job Materials API (Jobbmatriell)
export const jobMaterialsAPI = {
  getJobMaterials: async (): Promise<GetJobMaterialsResponse> => {
    const response = await api.get('/app/memo/jobbmatriell/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getJobMaterial: async (
    jobMaterialId: number
  ): Promise<GetJobMaterialResponse> => {
    const response = await api.get(`/app/memo/jobbmatriell/${jobMaterialId}/`);
    return response.data;
  },

  createJobMaterial: async (
    jobMaterialData: CreateJobMaterialPayload
  ): Promise<CreateJobMaterialResponse> => {
    try {
      const response = await api.post(
        '/app/memo/jobbmatriell/',
        jobMaterialData
      );
      showSuccessToast('Job material created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating job material');
      throw error;
    }
  },

  updateJobMaterial: async (
    jobMaterialId: number,
    jobMaterialData: UpdateJobMaterialPayload
  ): Promise<UpdateJobMaterialResponse> => {
    try {
      const response = await api.put(
        `/app/memo/jobbmatriell/${jobMaterialId}/`,
        jobMaterialData
      );
      showSuccessToast('Job material updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating job material');
      throw error;
    }
  },

  deleteJobMaterial: async (
    jobMaterialId: number
  ): Promise<DeleteJobMaterialResponse> => {
    try {
      const response = await api.delete(
        `/app/memo/jobbmatriell/${jobMaterialId}/`
      );
      showSuccessToast('Job material deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting job material');
      throw error;
    }
  },
};

// Job Images API
export const jobImagesAPI = {
  getJobImages: async (): Promise<GetJobImagesResponse> => {
    const response = await api.get('/app/memo/jobb-images/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getJobImage: async (imageId: number): Promise<GetJobImageResponse> => {
    const response = await api.get(`/app/memo/jobb-images/${imageId}/`);
    return response.data;
  },

  uploadJobImage: async (
    imageData: CreateJobImagePayload
  ): Promise<CreateJobImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', imageData.image);
      formData.append('jobb', imageData.jobb.toString());

      const response = await api.post('/app/memo/jobb-images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading job image');
      throw error;
    }
  },

  deleteJobImage: async (imageId: number): Promise<DeleteJobImageResponse> => {
    try {
      const response = await api.delete(`/app/memo/jobb-images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting job image');
      throw error;
    }
  },
};

// Job Files API
export const jobFilesAPI = {
  getJobFiles: async (): Promise<GetJobFilesResponse> => {
    const response = await api.get('/app/memo/jobb-files/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getJobFile: async (fileId: number): Promise<GetJobFileResponse> => {
    const response = await api.get(`/app/memo/jobb-files/${fileId}/`);
    return response.data;
  },

  uploadJobFile: async (
    fileData: CreateJobFilePayload
  ): Promise<CreateJobFileResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('jobb', fileData.jobb.toString());

      const response = await api.post('/app/memo/jobb-files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('File uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading job file');
      throw error;
    }
  },

  deleteJobFile: async (fileId: number): Promise<DeleteJobFileResponse> => {
    try {
      const response = await api.delete(`/app/memo/jobb-files/${fileId}/`);
      showSuccessToast('File deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting job file');
      throw error;
    }
  },
};

// Time Entries API (Timeliste)
export const timeEntriesAPI = {
  getTimeEntries: async (): Promise<GetTimeEntriesResponse> => {
    const response = await api.get('/app/memo/timeliste/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getTimeEntry: async (timeEntryId: number): Promise<GetTimeEntryResponse> => {
    const response = await api.get(`/app/memo/timeliste/${timeEntryId}/`);
    return response.data;
  },

  createTimeEntry: async (
    timeEntryData: CreateTimeEntryPayload
  ): Promise<CreateTimeEntryResponse> => {
    try {
      const response = await api.post('/app/memo/timeliste/', timeEntryData);
      showSuccessToast('Time entry created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating time entry');
      throw error;
    }
  },

  updateTimeEntry: async (
    timeEntryId: number,
    timeEntryData: UpdateTimeEntryPayload
  ): Promise<UpdateTimeEntryResponse> => {
    try {
      const response = await api.put(
        `/app/memo/timeliste/${timeEntryId}/`,
        timeEntryData
      );
      showSuccessToast('Time entry updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating time entry');
      throw error;
    }
  },

  deleteTimeEntry: async (
    timeEntryId: number
  ): Promise<DeleteTimeEntryResponse> => {
    try {
      const response = await api.delete(`/app/memo/timeliste/${timeEntryId}/`);
      showSuccessToast('Time entry deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting time entry');
      throw error;
    }
  },
};

// LLM Providers API
export const llmProvidersAPI = {
  getProviders: async (): Promise<GetLLMProvidersResponse> => {
    const response = await api.get('/app/components/providers/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getProvider: async (providerId: number): Promise<GetLLMProviderResponse> => {
    const response = await api.get(`/app/components/providers/${providerId}/`);
    return response.data;
  },

  createProvider: async (
    providerData: CreateLLMProviderPayload
  ): Promise<CreateLLMProviderResponse> => {
    try {
      // First try JSON payload
      const response = await api.post(
        '/app/components/providers/',
        providerData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      showSuccessToast('LLM Provider created successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON create failed, trying FormData:', jsonError);

      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        providerData.icon instanceof File
      ) {
        try {
          const formData = new FormData();
          Object.entries(providerData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (value instanceof File) {
                formData.append(key, value);
              } else if (Array.isArray(value)) {
                // Handle array fields like tag_ids and strengths
                value.forEach((item) => {
                  formData.append(key, item.toString());
                });
              } else {
                formData.append(key, value.toString());
              }
            }
          });

          const response = await api.post(
            '/app/components/providers/',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          showSuccessToast('LLM Provider created successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Creating LLM provider');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Creating LLM provider');
        throw jsonError;
      }
    }
  },

  updateProvider: async (
    providerId: number,
    providerData: UpdateLLMProviderPayload
  ): Promise<UpdateLLMProviderResponse> => {
    try {
      // First try JSON payload
      const response = await api.put(
        `/app/components/providers/${providerId}/`,
        providerData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      showSuccessToast('LLM Provider updated successfully');
      return response.data;
    } catch (jsonError: any) {
      console.log('JSON update failed, trying FormData:', jsonError);

      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        providerData.icon instanceof File
      ) {
        try {
          const formData = new FormData();
          Object.entries(providerData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (value instanceof File) {
                formData.append(key, value);
              } else if (Array.isArray(value)) {
                // Handle array fields like tag_ids and strengths
                value.forEach((item) => {
                  formData.append(key, item.toString());
                });
              } else {
                formData.append(key, value.toString());
              }
            }
          });

          const response = await api.put(
            `/app/components/providers/${providerId}/`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          showSuccessToast('LLM Provider updated successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Updating LLM provider');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Updating LLM provider');
        throw jsonError;
      }
    }
  },

  deleteProvider: async (
    providerId: number
  ): Promise<DeleteLLMProviderResponse> => {
    try {
      const response = await api.delete(
        `/app/components/providers/${providerId}/`
      );
      showSuccessToast('LLM Provider deleted successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Deleting LLM provider');
      throw error;
    }
  },
};

// System Monitoring API
export const systemAPI = {
  // System stats endpoints
  getSystemStats: async (): Promise<GetSystemStatsResponse> => {
    const response = await api.get('/api/docker/system-stats/');
    return Array.isArray(response.data) ? response.data : [];
  },

  getSystemStat: async (statId: number): Promise<GetSystemStatResponse> => {
    const response = await api.get(`/api/docker/system-stats/${statId}/`);
    return response.data;
  },

  getLatestSystemStats: async (): Promise<GetLatestSystemStatsResponse> => {
    const response = await api.get('/api/docker/system-stats/latest/');
    return response.data;
  },

  // Dashboard endpoints
  getSystemDashboard: async (): Promise<GetSystemDashboardResponse> => {
    const response = await api.get('/api/system/dashboard/');
    return response.data;
  },

  getHostSystemDashboard: async (
    hostId: number
  ): Promise<GetHostSystemDashboardResponse> => {
    const response = await api.get(`/api/system/dashboard/${hostId}/`);
    return response.data;
  },

  // Collection endpoints
  collectSystemStats: async (): Promise<PostSystemCollectResponse> => {
    try {
      const response = await api.post('/api/system/collect/');
      showSuccessToast('System stats collection initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Collecting system stats');
      throw error;
    }
  },
};

export default api;
