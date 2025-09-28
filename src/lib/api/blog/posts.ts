import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, createFormData } from '../shared/utils';
import {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  GetPostsResponse,
  GetPublicPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  DeletePostResponse,
  PostSearchParams,
} from './types';

export const postsAPI = {
  // Get public posts (no authentication required)
  getPublicPosts: async (params?: PostSearchParams): Promise<GetPublicPostsResponse> => {
    try {
      const url = createUrlWithParams('/app/blog/posts/public/', params);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting public posts');
      throw error;
    }
  },

  // Get all posts (authentication required)
  getPosts: async (params?: PostSearchParams): Promise<GetPostsResponse> => {
    try {
      const url = createUrlWithParams('/app/blog/posts/', params);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting posts');
      throw error;
    }
  },

  // Get single post by ID
  getPost: async (postId: string): Promise<GetPostResponse> => {
    try {
      const response = await api.get(`/app/blog/posts/${postId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting post');
      throw error;
    }
  },

  // Get post by slug
  getPostBySlug: async (slug: string): Promise<GetPostResponse> => {
    try {
      const response = await api.get(`/app/blog/posts/by-slug/${slug}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting post by slug');
      throw error;
    }
  },

  // Create new post
  createPost: async (postData: CreatePostPayload): Promise<CreatePostResponse> => {
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
        const formData = createFormData(postData);
        const response = await api.post('/app/blog/posts/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showSuccessToast('Post created successfully');
        return response.data;
      } catch (error) {
        handleApiError(error, 'Creating post');
        throw error;
      }
    }
  },

  // Update existing post
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
        const formData = createFormData(postData);
        const response = await api.put(`/app/blog/posts/${postId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showSuccessToast('Post updated successfully');
        return response.data;
      } catch (error) {
        handleApiError(error, 'Updating post');
        throw error;
      }
    }
  },

  // Delete post
  deletePost: async (postId: string): Promise<DeletePostResponse> => {
    try {
      await api.delete(`/app/blog/posts/${postId}/`);
      showSuccessToast('Post deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting post');
      throw error;
    }
  },

  // Publish draft post
  publishPost: async (postId: string): Promise<UpdatePostResponse> => {
    try {
      const response = await api.patch(`/app/blog/posts/${postId}/`, {
        status: 'published',
        published_at: new Date().toISOString(),
      });
      showSuccessToast('Post published successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Publishing post');
      throw error;
    }
  },

  // Archive post
  archivePost: async (postId: string): Promise<UpdatePostResponse> => {
    try {
      const response = await api.patch(`/app/blog/posts/${postId}/`, {
        status: 'archived',
      });
      showSuccessToast('Post archived successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Archiving post');
      throw error;
    }
  },

  // Duplicate post
  duplicatePost: async (postId: string): Promise<CreatePostResponse> => {
    try {
      const response = await api.post(`/app/blog/posts/${postId}/duplicate/`);
      showSuccessToast('Post duplicated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Duplicating post');
      throw error;
    }
  },
};