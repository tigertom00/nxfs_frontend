import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategorySearchParams,
  GetCategoriesResponse,
  GetCategoryResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
} from './types';

export const categoriesAPI = {
  // Get all categories
  getCategories: async (
    params?: CategorySearchParams
  ): Promise<GetCategoriesResponse> => {
    try {
      const url = createUrlWithParams('/app/tasks/categories/', params);
      const response = await api.get(url);

      // Handle both paginated and array responses
      const normalized = normalizeResponse<Category>(response.data);
      return Array.isArray(normalized) ? normalized : normalized.results || [];
    } catch (error) {
      handleApiError(error, 'Getting categories');
      throw error;
    }
  },

  // Get single category by ID
  getCategory: async (categoryId: string): Promise<GetCategoryResponse> => {
    try {
      const response = await api.get(`/app/tasks/categories/${categoryId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting category');
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<GetCategoryResponse> => {
    try {
      const response = await api.get(`/app/tasks/categories/by-slug/${slug}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting category by slug');
      throw error;
    }
  },

  // Create new category
  createCategory: async (
    categoryData: CreateCategoryPayload
  ): Promise<CreateCategoryResponse> => {
    try {
      const response = await api.post('/app/tasks/categories/', categoryData);
      showSuccessToast('Category created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating category');
      throw error;
    }
  },

  // Update existing category
  updateCategory: async (
    categoryId: string,
    categoryData: UpdateCategoryPayload
  ): Promise<UpdateCategoryResponse> => {
    try {
      const response = await api.put(
        `/app/tasks/categories/${categoryId}/`,
        categoryData
      );
      showSuccessToast('Category updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating category');
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (
    categoryId: string
  ): Promise<DeleteCategoryResponse> => {
    try {
      await api.delete(`/app/tasks/categories/${categoryId}/`);
      showSuccessToast('Category deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting category');
      throw error;
    }
  },

  // Get categories with task counts
  getCategoriesWithCounts: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/app/tasks/categories/with-counts/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting categories with task counts');
      throw error;
    }
  },

  // Get popular categories
  getPopularCategories: async (limit = 10): Promise<Category[]> => {
    try {
      const response = await api.get(
        `/app/tasks/categories/popular/?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting popular categories');
      throw error;
    }
  },

  // Search categories
  searchCategories: async (query: string): Promise<Category[]> => {
    try {
      const response = await api.get(
        `/app/tasks/categories/search/?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Searching categories');
      throw error;
    }
  },

  // Bulk operations
  bulkDeleteCategories: async (categoryIds: string[]): Promise<void> => {
    try {
      await api.post('/app/tasks/categories/bulk-delete/', {
        category_ids: categoryIds,
      });
      showSuccessToast(`${categoryIds.length} categories deleted successfully`);
    } catch (error) {
      handleApiError(error, 'Bulk deleting categories');
      throw error;
    }
  },

  // Merge categories (combine multiple categories into one)
  mergeCategories: async (
    targetCategoryId: string,
    sourceCategoryIds: string[]
  ): Promise<Category> => {
    try {
      const response = await api.post(
        `/app/tasks/categories/${targetCategoryId}/merge/`,
        {
          source_category_ids: sourceCategoryIds,
        }
      );
      showSuccessToast('Categories merged successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Merging categories');
      throw error;
    }
  },
};
