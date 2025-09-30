import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { ChoiceItem } from '../shared/types';
import {
  Supplier,
  SupplierSearchParams,
  GetSuppliersResponse,
  GetSupplierResponse,
  CreateSupplierResponse,
  UpdateSupplierResponse,
} from './types';

export interface CreateSupplierPayload {
  navn: string;
  telefon?: string;
  hjemmeside?: string;
  addresse?: string;
  poststed?: string;
  postnummer?: string;
  epost?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export const suppliersAPI = {
  // List suppliers with search and pagination
  getSuppliers: async (
    params?: SupplierSearchParams
  ): Promise<GetSuppliersResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/leverandorer/', params);
      const response = await api.get(url);
      return normalizeResponse<Supplier>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting suppliers');
      throw error;
    }
  },

  // Get supplier by ID
  getSupplier: async (supplierId: number): Promise<GetSupplierResponse> => {
    try {
      const response = await api.get(`/app/memo/leverandorer/${supplierId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting supplier');
      throw error;
    }
  },

  // Supplier lookup by name
  lookupSupplier: async (name: string): Promise<GetSupplierResponse> => {
    try {
      const response = await api.get(
        `/app/memo/leverandorer/lookup/?name=${encodeURIComponent(name)}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Looking up supplier');
      throw error;
    }
  },

  // Supplier choices for dropdowns
  getSupplierChoices: async (params?: {
    search?: string;
    limit?: number;
  }): Promise<ChoiceItem[]> => {
    try {
      const url = createUrlWithParams('/app/memo/leverandorer/choices/', {
        search: params?.search || '',
        limit: params?.limit || 50,
      });
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting supplier choices');
      throw error;
    }
  },

  // Create supplier
  createSupplier: async (
    supplierData: CreateSupplierPayload
  ): Promise<CreateSupplierResponse> => {
    try {
      const response = await api.post('/app/memo/leverandorer/', supplierData);
      showSuccessToast('Supplier created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating supplier');
      throw error;
    }
  },

  // Update supplier
  updateSupplier: async (
    supplierId: number,
    supplierData: UpdateSupplierPayload
  ): Promise<UpdateSupplierResponse> => {
    try {
      const response = await api.patch(
        `/app/memo/leverandorer/${supplierId}/`,
        supplierData
      );
      showSuccessToast('Supplier updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating supplier');
      throw error;
    }
  },

  // Delete supplier
  deleteSupplier: async (supplierId: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/leverandorer/${supplierId}/`);
      showSuccessToast('Supplier deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting supplier');
      throw error;
    }
  },
};
