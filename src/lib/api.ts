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
    const originalRequest = error.config;

    // Handle network errors
    if (typeof error.response === 'undefined') {
      console.error(
        'A server/network error occurred. ' +
          'Looks like CORS might be the problem. ' +
          'Sorry about this - we will get it fixed shortly.'
      );
      return Promise.reject(error);
    }

    console.log('API error:', error.response?.data);

    // Prevent infinite refresh loops - if refresh endpoint fails, redirect to login
    if (
      error.response?.status === 401 &&
      originalRequest.url?.includes('/token/refresh/')
    ) {
      console.log('Refresh token endpoint failed, redirecting to login.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Handle 401/403 errors with token refresh
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      (error.response?.data?.code === 'token_not_valid' ||
        error.response?.data?.detail?.includes('token'))
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Check if refresh token is expired before attempting refresh
          try {
            const tokenParts = JSON.parse(atob(refreshToken.split('.')[1]));
            const now = Math.ceil(Date.now() / 1000);

            if (tokenParts.exp <= now) {
              console.log('Refresh token is expired', tokenParts.exp, now);
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/';
              return Promise.reject(new Error('Refresh token expired'));
            }
          } catch (tokenDecodeError) {
            console.warn('Could not decode refresh token, attempting refresh anyway');
          }

          // Use a separate axios instance for refresh to avoid circular interceptor calls
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { access, refresh } = refreshResponse.data;
          localStorage.setItem('accessToken', access);

          // Update refresh token if provided (some APIs return a new refresh token)
          if (refresh) {
            localStorage.setItem('refreshToken', refresh);
          }

          // Update both the default headers and the original request headers
          api.defaults.headers.Authorization = `Bearer ${access}`;
          originalRequest.headers.Authorization = `Bearer ${access}`;

          console.log('Token refreshed successfully');
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
