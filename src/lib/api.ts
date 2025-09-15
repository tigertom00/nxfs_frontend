import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API base URL
const API_BASE_URL = 'https://api.nxfs.no';

// N8N chatbot URL
const N8N_CHATBOT_URL = 'https://n8n.nxfs.no/webhook/nxfs';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
    console.log('API error:', error.response.data);
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
            `${API_BASE_URL}/token/refresh/`,
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
    console.log('Request error:', error.response?.data);
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/token/`, {
      email,
      password,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/user/');
    return response.data;
  },

  updateUser: async (userId: string, userData: any) => {
    const response = await api.put(`/user/${userId}/`, userData);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/user/${userId}/`);
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getPublicPosts: async () => {
    const response = await api.get('/api/posts/public/');
    return response.data;
  },

  getPosts: async () => {
    const response = await api.get('/api/posts/');
    return response.data;
  },

  getPost: async (postId: string) => {
    const response = await api.get(`/api/posts/${postId}/`);
    return response.data;
  },

  createPost: async (postData: any) => {
    const response = await api.post('/api/posts/', postData);
    return response.data;
  },

  updatePost: async (postId: string, postData: any) => {
    const response = await api.put(`/api/posts/${postId}/`, postData);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await api.delete(`/api/posts/${postId}/`);
    return response.data;
  },
};

// N8N Chatbot API
export const chatbotAPI = {
  sendMessage: async (
    sessionId: string,
    chatInput: string,
    secretKey: string
  ) => {
    const response = await axios.post(
      N8N_CHATBOT_URL,
      {
        sessionId,
        action: 'sendMessage',
        chatInput,
      },
      {
        headers: {
          nxfs_blog: secretKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async () => {
    const response = await api.get('/app/tasks/');
    return response.data;
  },

  getTask: async (taskId: string) => {
    const response = await api.get(`/app/tasks/${taskId}/`);
    return response.data;
  },

  createTask: async (taskData: any) => {
    const response = await api.post('/app/tasks/', taskData);
    return response.data;
  },

  updateTask: async (taskId: string, taskData: any) => {
    const response = await api.put(`/app/tasks/${taskId}/`, taskData);
    return response.data;
  },

  patchTask: async (taskId: string, taskData: any) => {
    const response = await api.patch(`/app/tasks/${taskId}/`, taskData);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/app/tasks/${taskId}/`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async () => {
    const response = await api.get('/app/tasks/categories/');
    return response.data;
  },
  getCategory: async (categoryId: string) => {
    const response = await api.get(`/app/tasks/categories/${categoryId}/`);
    return response.data;
  },
  createCategory: async (categoryData: any) => {
    const response = await api.post('/app/tasks/categories/', categoryData);
    return response.data;
  },
  updateCategory: async (categoryId: string, categoryData: any) => {
    const response = await api.put(
      `/app/tasks/categories/${categoryId}/`,
      categoryData
    );
    return response.data;
  },
  deleteCategory: async (categoryId: string) => {
    const response = await api.delete(`/app/tasks/categories/${categoryId}/`);
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async () => {
    const response = await api.get('/app/projects/');
    return response.data;
  },
  getProject: async (projectId: string) => {
    const response = await api.get(`/app/projects/${projectId}/`);
    return response.data;
  },
  createProject: async (projectData: any) => {
    const response = await api.post('/app/projects/', projectData);
    return response.data;
  },
  updateProject: async (projectId: string, projectData: any) => {
    const response = await api.put(`/app/projects/${projectId}/`, projectData);
    return response.data;
  },
  deleteProject: async (projectId: string) => {
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
