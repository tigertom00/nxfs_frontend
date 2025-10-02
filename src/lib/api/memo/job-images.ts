import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { JobImage } from './types';
import { PaginatedResponse } from '../shared/types';

export const jobImagesAPI = {
  // Get all job images
  getJobImages: async (params?: {
    jobb?: string;
  }): Promise<JobImage[] | PaginatedResponse<JobImage>> => {
    try {
      const url = createUrlWithParams('/app/memo/jobb-images/', params);
      const response = await api.get(url);
      return normalizeResponse<JobImage>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting job images');
      throw error;
    }
  },

  // Get images by job ID using the specific endpoint
  getImagesByJob: async (jobId: string | number): Promise<JobImage[]> => {
    try {
      const response = await api.get(
        `/app/memo/jobb-images/by_job/?jobb_id=${jobId}`
      );
      // This endpoint returns {jobb: {...}, image_count: number, images: [...]}
      // Don't use normalizeResponse since it has a unique structure
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job images by job ID');
      throw error;
    }
  },

  // Get job image by ID
  getJobImage: async (id: number): Promise<JobImage> => {
    try {
      const response = await api.get(`/app/memo/jobb-images/${id}/`);
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

  // Bulk upload job images
  bulkUploadJobImages: async (payload: {
    images: File[];
    jobb: number | string;
  }): Promise<JobImage[]> => {
    try {
      const formData = new FormData();

      payload.images.forEach((image, index) => {
        formData.append('images', image);
      });
      formData.append('jobb', payload.jobb.toString());

      const response = await api.post(
        '/app/memo/jobb-images/bulk_upload/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showSuccessToast(`${payload.images.length} images uploaded successfully`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Bulk uploading job images');
      throw error;
    }
  },

  // Set primary image
  setPrimaryImage: async (id: number): Promise<JobImage> => {
    try {
      const response = await api.post(
        `/app/memo/jobb-images/${id}/set_primary/`
      );
      showSuccessToast('Primary image set successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Setting primary image');
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
      const response = await api.patch(`/app/memo/jobb-images/${id}/`, payload);
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
      await api.delete(`/app/memo/jobb-images/${id}/`);
      showSuccessToast('Image deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting job image');
      throw error;
    }
  },
};
