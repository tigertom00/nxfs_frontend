import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  createUrlWithParams,
  createFormData,
  normalizeResponse,
} from '../shared/utils';
import {
  ChoiceItem,
  BulkOperationResponse,
  PaginatedResponse,
} from '../shared/types';
import {
  Material,
  MaterialSearchParams,
  CreateMaterialPayload,
  UpdateMaterialPayload,
  GetMaterialsResponse,
  GetMaterialsPaginatedResponse,
  GetMaterialResponse,
  CreateMaterialResponse,
  UpdateMaterialResponse,
  BulkMaterialUpdatePayload,
  BulkFavoritePayload,
  MaterialValidationPayload,
  MaterialValidationResponse,
  EFOBasenImportPayload,
} from './types';

export const materialsAPI = {
  // List materials with search and pagination
  getMaterials: async (
    params?: MaterialSearchParams
  ): Promise<GetMaterialsResponse | GetMaterialsPaginatedResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/matriell/', params);
      const response = await api.get(url);

      // If response has pagination structure, return it as is
      if (
        response.data &&
        typeof response.data === 'object' &&
        'count' in response.data &&
        'results' in response.data
      ) {
        return response.data as GetMaterialsPaginatedResponse;
      }

      // Otherwise return as simple array
      return normalizeResponse<Material>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting materials');
      throw error;
    }
  },

  // Simplified method for getting all materials (backward compatibility)
  getAllMaterials: async (): Promise<GetMaterialsResponse> => {
    try {
      const response = await api.get('/app/memo/matriell/');
      return normalizeResponse<Material>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting all materials');
      throw error;
    }
  },

  // Method specifically for search with pagination
  searchMaterials: async (
    params: MaterialSearchParams
  ): Promise<GetMaterialsPaginatedResponse> => {
    try {
      const result = await materialsAPI.getMaterials(params);

      // If it's already paginated, return as is
      if (typeof result === 'object' && 'count' in result) {
        return result;
      }

      // If it's a simple array, wrap it in pagination format
      return {
        count: result.length,
        next: null,
        previous: null,
        results: result,
      };
    } catch (error) {
      handleApiError(error, 'Searching materials');
      throw error;
    }
  },

  // Get material by ID
  getMaterial: async (materialId: number): Promise<GetMaterialResponse> => {
    try {
      const response = await api.get(`/app/memo/matriell/${materialId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting material');
      throw error;
    }
  },

  // Quick material lookup by EL number
  lookupMaterial: async (elNr: string): Promise<GetMaterialResponse> => {
    try {
      const response = await api.get(
        `/app/memo/matriell/lookup/?el_nr=${elNr}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Looking up material');
      throw error;
    }
  },

  // Material choices for dropdowns (optimized endpoint)
  getMaterialChoices: async (params?: {
    search?: string;
    limit?: number;
  }): Promise<ChoiceItem[]> => {
    try {
      const url = createUrlWithParams('/app/memo/matriell/choices/', {
        search: params?.search || '',
        limit: params?.limit || 50,
      });
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting material choices');
      throw error;
    }
  },

  // Create material
  createMaterial: async (
    materialData: CreateMaterialPayload
  ): Promise<CreateMaterialResponse> => {
    try {
      // Check if we have file uploads
      const hasFiles = Object.values(materialData).some(
        (value) => value instanceof File
      );

      if (hasFiles) {
        const formData = createFormData(materialData);
        const response = await api.post('/app/memo/matriell/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showSuccessToast('Material created successfully');
        return response.data;
      } else {
        const response = await api.post('/app/memo/matriell/', materialData);
        showSuccessToast('Material created successfully');
        return response.data;
      }
    } catch (error) {
      handleApiError(error, 'Creating material');
      throw error;
    }
  },

  // Update material
  updateMaterial: async (
    materialId: number,
    materialData: UpdateMaterialPayload
  ): Promise<UpdateMaterialResponse> => {
    try {
      // Check if we have file uploads
      const hasFiles = Object.values(materialData).some(
        (value) => value instanceof File
      );

      if (hasFiles) {
        const formData = createFormData(materialData);
        const response = await api.patch(
          `/app/memo/matriell/${materialId}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showSuccessToast('Material updated successfully');
        return response.data;
      } else {
        const response = await api.patch(
          `/app/memo/matriell/${materialId}/`,
          materialData
        );
        showSuccessToast('Material updated successfully');
        return response.data;
      }
    } catch (error) {
      handleApiError(error, 'Updating material');
      throw error;
    }
  },

  // Delete material
  deleteMaterial: async (materialId: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/matriell/${materialId}/`);
      showSuccessToast('Material deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting material');
      throw error;
    }
  },

  // Favorite management
  addToFavorites: async (
    materialId: number
  ): Promise<UpdateMaterialResponse> => {
    try {
      const response = await api.post(
        `/app/memo/matriell/${materialId}/favorite/`
      );
      showSuccessToast('Material added to favorites');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Adding material to favorites');
      throw error;
    }
  },

  removeFromFavorites: async (materialId: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/matriell/${materialId}/favorite/`);
      showSuccessToast('Material removed from favorites');
    } catch (error) {
      handleApiError(error, 'Removing material from favorites');
      throw error;
    }
  },

  checkFavoriteStatus: async (
    materialId: number
  ): Promise<{ is_favorite: boolean }> => {
    try {
      const response = await api.get(
        `/app/memo/matriell/${materialId}/favorite/`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Checking favorite status');
      throw error;
    }
  },

  toggleFavorite: async (
    materialId: number
  ): Promise<UpdateMaterialResponse> => {
    try {
      // Check current status first
      const status = await materialsAPI.checkFavoriteStatus(materialId);

      if (status.is_favorite) {
        await materialsAPI.removeFromFavorites(materialId);
        // Return updated material data
        return await materialsAPI.getMaterial(materialId);
      } else {
        return await materialsAPI.addToFavorites(materialId);
      }
    } catch (error) {
      handleApiError(error, 'Toggling material favorite status');
      throw error;
    }
  },

  // Get all favorites
  getFavorites: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<GetMaterialsResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/matriell/favorites/', params);
      const response = await api.get(url);
      return normalizeResponse<Material>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting favorite materials');
      throw error;
    }
  },

  // Bulk operations
  bulkUpdateMaterials: async (
    payload: BulkMaterialUpdatePayload
  ): Promise<BulkOperationResponse> => {
    try {
      const response = await api.post(
        '/app/memo/matriell/bulk_operations/',
        payload
      );
      showSuccessToast(`Bulk operation completed: ${response.data.message}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Bulk material update');
      throw error;
    }
  },

  bulkFavoriteAction: async (
    payload: BulkFavoritePayload
  ): Promise<BulkOperationResponse> => {
    try {
      const response = await api.post(
        '/app/memo/matriell/bulk_favorite/',
        payload
      );
      showSuccessToast(
        `Bulk favorite operation completed: ${response.data.affected_count} materials ${
          payload.action === 'add' ? 'added to' : 'removed from'
        } favorites`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Bulk favorite operation');
      throw error;
    }
  },

  // Data validation
  validateMaterialData: async (
    payload: MaterialValidationPayload
  ): Promise<MaterialValidationResponse> => {
    try {
      const response = await api.post(
        '/app/memo/matriell/validate_data/',
        payload
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Validating material data');
      throw error;
    }
  },

  // Check duplicates
  checkDuplicates: async (params: {
    el_nr?: string;
    gtin_number?: string;
    tittel?: string;
    limit?: number;
  }): Promise<Material[] | PaginatedResponse<Material>> => {
    try {
      const url = createUrlWithParams(
        '/app/memo/matriell/check_duplicates/',
        params
      );
      const response = await api.get(url);
      return normalizeResponse<Material>(response.data);
    } catch (error) {
      handleApiError(error, 'Checking duplicates');
      throw error;
    }
  },

  // EFO Basen import
  importFromEFObasen: async (
    efoData: EFOBasenImportPayload
  ): Promise<CreateMaterialResponse> => {
    try {
      const response = await api.post(
        '/app/memo/matriell/efobasen_import/',
        efoData
      );
      showSuccessToast('Material imported from EFObasen successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Importing material from EFObasen');
      throw error;
    }
  },
};
