import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { normalizeResponse } from '../shared/utils';
import {
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
  GetTagsResponse,
  GetTagResponse,
  CreateTagResponse,
  UpdateTagResponse,
  DeleteTagResponse,
} from './types';

export const tagsAPI = {
  // Get all tags
  getTags: async (): Promise<GetTagsResponse> => {
    try {
      const response = await api.get('/app/blog/tags/');
      // Handle both paginated and array responses
      const normalized = normalizeResponse<Tag>(response.data);
      return Array.isArray(normalized) ? normalized : normalized.results || [];
    } catch (error) {
      handleApiError(error, 'Getting tags');
      throw error;
    }
  },

  // Get single tag by ID
  getTag: async (tagId: string): Promise<GetTagResponse> => {
    try {
      const response = await api.get(`/app/blog/tags/${tagId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting tag');
      throw error;
    }
  },

  // Get tag by slug
  getTagBySlug: async (slug: string): Promise<GetTagResponse> => {
    try {
      const response = await api.get(`/app/blog/tags/by-slug/${slug}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting tag by slug');
      throw error;
    }
  },

  // Create new tag
  createTag: async (tagData: CreateTagPayload): Promise<CreateTagResponse> => {
    try {
      const response = await api.post('/app/blog/tags/', tagData);
      showSuccessToast('Tag created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating tag');
      throw error;
    }
  },

  // Update existing tag
  updateTag: async (
    tagId: string,
    tagData: UpdateTagPayload
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

  // Delete tag
  deleteTag: async (tagId: string): Promise<DeleteTagResponse> => {
    try {
      await api.delete(`/app/blog/tags/${tagId}/`);
      showSuccessToast('Tag deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting tag');
      throw error;
    }
  },

  // Get popular tags
  getPopularTags: async (limit = 10): Promise<Tag[]> => {
    try {
      const response = await api.get(`/app/blog/tags/popular/?limit=${limit}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting popular tags');
      throw error;
    }
  },

  // Search tags
  searchTags: async (query: string): Promise<Tag[]> => {
    try {
      const response = await api.get(
        `/app/blog/tags/search/?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Searching tags');
      throw error;
    }
  },

  // Bulk operations
  bulkDeleteTags: async (tagIds: string[]): Promise<void> => {
    try {
      await api.post('/app/blog/tags/bulk-delete/', { tag_ids: tagIds });
      showSuccessToast(`${tagIds.length} tags deleted successfully`);
    } catch (error) {
      handleApiError(error, 'Bulk deleting tags');
      throw error;
    }
  },

  // Merge tags (combine multiple tags into one)
  mergeTags: async (targetTagId: string, sourceTagIds: string[]): Promise<Tag> => {
    try {
      const response = await api.post(`/app/blog/tags/${targetTagId}/merge/`, {
        source_tag_ids: sourceTagIds,
      });
      showSuccessToast('Tags merged successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Merging tags');
      throw error;
    }
  },
};