import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { JobImage, JobImagesResponse } from './types';
import { PaginatedResponse } from '../shared/types';

/**
 * Truncate filename to fit within max length (default 100 chars) while preserving extension
 * @param filename - Original filename
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Truncated filename
 */
const truncateFilename = (
  filename: string,
  maxLength: number = 100
): string => {
  if (filename.length <= maxLength) {
    return filename;
  }

  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name =
    lastDotIndex > -1 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > -1 ? filename.substring(lastDotIndex) : '';

  // Calculate available space for the name (reserving space for extension)
  const maxNameLength = maxLength - extension.length;

  // Truncate the name and add extension back
  return name.substring(0, maxNameLength) + extension;
};

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
  getImagesByJob: async (
    jobId: string | number
  ): Promise<JobImagesResponse | JobImage[]> => {
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

      // Truncate filename if needed
      const truncatedName = payload.name
        ? truncateFilename(payload.name)
        : truncateFilename(payload.image.name);

      // Create a new File object with truncated name if necessary
      const imageFile =
        payload.image.name.length > 100
          ? new File([payload.image], truncatedName, {
              type: payload.image.type,
            })
          : payload.image;

      formData.append('image', imageFile);
      formData.append('jobb', payload.jobb.toString());
      formData.append('name', truncatedName);

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

      // Truncate filenames for all images if needed
      payload.images.forEach((image) => {
        const imageFile =
          image.name.length > 100
            ? new File([image], truncateFilename(image.name), {
                type: image.type,
              })
            : image;
        formData.append('images', imageFile);
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
