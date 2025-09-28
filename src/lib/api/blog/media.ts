import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  PostImage,
  PostAudio,
  PostYouTube,
  UploadPostImageResponse,
  UploadPostAudioResponse,
  UploadPostYouTubeResponse,
  DeletePostImageResponse,
  DeletePostAudioResponse,
  DeletePostYouTubeResponse,
} from './types';

export const mediaAPI = {
  // Image management
  getImages: async (postId: string): Promise<PostImage[]> => {
    try {
      const response = await api.get(`/app/blog/posts/${postId}/images/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting post images');
      throw error;
    }
  },

  uploadImage: async (
    postId: string,
    image: File,
    altText?: string
  ): Promise<UploadPostImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);
      if (altText) {
        formData.append('alt_text', altText);
      }

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
      await api.delete(`/app/blog/posts/${postId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting post image');
      throw error;
    }
  },

  // Audio management
  getAudio: async (postId: string): Promise<PostAudio[]> => {
    try {
      const response = await api.get(`/app/blog/posts/${postId}/audio/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting post audio');
      throw error;
    }
  },

  uploadAudio: async (
    postId: string,
    audio: File,
    title?: string
  ): Promise<UploadPostAudioResponse> => {
    try {
      const formData = new FormData();
      formData.append('audio', audio);
      if (title) {
        formData.append('title', title);
      }

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
      await api.delete(`/app/blog/posts/${postId}/audio/${audioId}/`);
      showSuccessToast('Audio deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting post audio');
      throw error;
    }
  },

  // YouTube video management
  getYouTubeVideos: async (postId: string): Promise<PostYouTube[]> => {
    try {
      const response = await api.get(`/app/blog/posts/${postId}/youtube/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting YouTube videos');
      throw error;
    }
  },

  uploadYouTube: async (
    postId: string,
    url: string,
    title?: string
  ): Promise<UploadPostYouTubeResponse> => {
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

  deleteYouTube: async (
    postId: string,
    youtubeId: string
  ): Promise<DeletePostYouTubeResponse> => {
    try {
      await api.delete(`/app/blog/posts/${postId}/youtube/${youtubeId}/`);
      showSuccessToast('YouTube video deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting YouTube video');
      throw error;
    }
  },

  // Bulk operations
  deleteAllImages: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/app/blog/posts/${postId}/images/`);
      showSuccessToast('All images deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting all post images');
      throw error;
    }
  },

  deleteAllAudio: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/app/blog/posts/${postId}/audio/`);
      showSuccessToast('All audio files deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting all post audio');
      throw error;
    }
  },

  deleteAllYouTube: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/app/blog/posts/${postId}/youtube/`);
      showSuccessToast('All YouTube videos deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting all YouTube videos');
      throw error;
    }
  },
};