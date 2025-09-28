import api from '../base';
import { handleApiError } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { ChoiceItem } from '../shared/types';
import {
  ElectricalCategory,
  CategorySearchParams,
  GetCategoriesResponse,
  GetCategoryResponse,
} from './types';

export const categoriesAPI = {
  // List electrical categories with search and pagination
  getCategories: async (params?: CategorySearchParams): Promise<GetCategoriesResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/elektrisk-kategorier/', params);
      const response = await api.get(url);
      return normalizeResponse<ElectricalCategory>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting categories');
      throw error;
    }
  },

  // Get category by ID
  getCategory: async (categoryId: number): Promise<GetCategoryResponse> => {
    try {
      const response = await api.get(`/app/memo/elektrisk-kategorier/${categoryId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting category');
      throw error;
    }
  },

  // Category choices for dropdowns
  getCategoryChoices: async (params?: {
    search?: string;
    limit?: number;
  }): Promise<ChoiceItem[]> => {
    try {
      const url = createUrlWithParams('/app/memo/elektrisk-kategorier/choices/', {
        search: params?.search || '',
        limit: params?.limit || 50,
      });
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting category choices');
      throw error;
    }
  },
};