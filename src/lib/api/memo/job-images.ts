import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { JobImage } from './types';

export const jobImagesAPI = {
  // Get all job images
  getJobImages: async (params?: {
    jobb?: string;
  }): Promise<JobImage[]> => {
    try {
      const url = createUrlWithParams('/app/memo/jobbbilder/', params);
      const response = await api.get(url);
      return normalizeResponse<JobImage>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting job images');
      throw error;
    }
  },

  // Get job image by ID
  getJobImage: async (id: number): Promise<JobImage> => {
    try {
      const response = await api.get(`/app/memo/jobbbilder/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job image');
      throw error;
    }
  },

  // Upload job image
  uploadJobImage: async (payload: {
    image: File;
    jobb: number | string;
    name?: string;
  }): Promise<JobImage> => {
    try {
      const formData = new FormData();
      formData.append('image', payload.image);
      formData.append('jobb', payload.jobb.toString());

      if (payload.name) {
        formData.append('name', payload.name);
      } else {
        // Use filename as name if not provided
        formData.append('name', payload.image.name);
      }

      const response = await api.post('/app/memo/jobbbilder/', formData, {
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

  // Update job image
  updateJobImage: async (
    id: number,
    payload: {
      name?: string;
      jobb?: number | string;
    }
  ): Promise<JobImage> => {
    try {
      const response = await api.patch(`/app/memo/jobbbilder/${id}/`, payload);
      showSuccessToast('Image updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating job image');
      throw error;
    }
  },

  // Delete job image
  deleteJobImage: async (id: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/jobbbilder/${id}/`);
      showSuccessToast('Image deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting job image');
      throw error;
    }
  },
};