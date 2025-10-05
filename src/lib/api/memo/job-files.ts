import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { JobFile } from './types';
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

export const jobFilesAPI = {
  // Get all job files
  getJobFiles: async (params?: {
    jobb?: string;
  }): Promise<JobFile[] | PaginatedResponse<JobFile>> => {
    try {
      const url = createUrlWithParams('/app/memo/jobb-files/', params);
      const response = await api.get(url);
      return normalizeResponse<JobFile>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting job files');
      throw error;
    }
  },

  // Get files by job ID using the specific endpoint
  getFilesByJob: async (jobId: string | number): Promise<JobFile[]> => {
    try {
      const response = await api.get(
        `/app/memo/jobb-files/by_job/?jobb_id=${jobId}`
      );
      // This endpoint returns {jobb: {...}, file_count: number, files: [...]}
      // Don't use normalizeResponse since it has a unique structure
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job files by job ID');
      throw error;
    }
  },

  // Get job file by ID
  getJobFile: async (id: number): Promise<JobFile> => {
    try {
      const response = await api.get(`/app/memo/jobb-files/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job file');
      throw error;
    }
  },

  // Upload job file
  uploadJobFile: async (payload: {
    file: File;
    jobb: number | string;
    name?: string;
    file_type?: string;
  }): Promise<JobFile> => {
    try {
      const formData = new FormData();

      // Truncate filename if needed
      const truncatedName = payload.name
        ? truncateFilename(payload.name)
        : truncateFilename(payload.file.name);

      // Create a new File object with truncated name if necessary
      const file =
        payload.file.name.length > 100
          ? new File([payload.file], truncatedName, { type: payload.file.type })
          : payload.file;

      formData.append('file', file);
      formData.append('jobb', payload.jobb.toString());
      formData.append('name', truncatedName);

      if (payload.file_type) {
        formData.append('file_type', payload.file_type);
      }

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

  // Bulk upload job files
  bulkUploadJobFiles: async (payload: {
    files: File[];
    jobb: number | string;
  }): Promise<JobFile[]> => {
    try {
      const formData = new FormData();

      // Truncate filenames for all files if needed
      payload.files.forEach((file) => {
        const truncatedFile =
          file.name.length > 100
            ? new File([file], truncateFilename(file.name), { type: file.type })
            : file;
        formData.append('files', truncatedFile);
      });
      formData.append('jobb', payload.jobb.toString());

      const response = await api.post(
        '/app/memo/jobb-files/bulk_upload/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showSuccessToast(`${payload.files.length} files uploaded successfully`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Bulk uploading job files');
      throw error;
    }
  },

  // Get file types
  getFileTypes: async (): Promise<string[]> => {
    try {
      const response = await api.get('/app/memo/jobb-files/file_types/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting file types');
      throw error;
    }
  },

  // Update job file
  updateJobFile: async (
    id: number,
    payload: {
      name?: string;
      jobb?: number | string;
      file_type?: string;
    }
  ): Promise<JobFile> => {
    try {
      const response = await api.patch(`/app/memo/jobb-files/${id}/`, payload);
      showSuccessToast('File updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating job file');
      throw error;
    }
  },

  // Delete job file
  deleteJobFile: async (id: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/jobb-files/${id}/`);
      showSuccessToast('File deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting job file');
      throw error;
    }
  },
};
