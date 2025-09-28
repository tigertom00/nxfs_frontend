import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createFormData, normalizeResponse } from '../shared/utils';
import {
  LLMProvider,
  CreateLLMProviderPayload,
  UpdateLLMProviderPayload,
  GetLLMProvidersResponse,
  GetLLMProviderResponse,
  CreateLLMProviderResponse,
  UpdateLLMProviderResponse,
  DeleteLLMProviderResponse,
  TestLLMProviderResponse,
} from './types';

export const providersAPI = {
  // Get all providers
  getProviders: async (): Promise<LLMProvider[]> => {
    try {
      const response = await api.get('/app/components/providers/');

      // Handle both paginated and array responses
      const normalized = normalizeResponse<LLMProvider>(response.data);
      return Array.isArray(normalized) ? normalized : normalized.results || [];
    } catch (error) {
      handleApiError(error, 'Getting LLM providers');
      throw error;
    }
  },

  // Get single provider
  getProvider: async (providerId: number): Promise<GetLLMProviderResponse> => {
    try {
      const response = await api.get(
        `/app/components/providers/${providerId}/`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting LLM provider');
      throw error;
    }
  },

  // Create provider
  createProvider: async (
    providerData: CreateLLMProviderPayload
  ): Promise<CreateLLMProviderResponse> => {
    try {
      // First try JSON payload
      const response = await api.post(
        '/app/components/providers/',
        providerData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      showSuccessToast('LLM Provider created successfully');
      return response.data;
    } catch (jsonError: any) {
      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        providerData.icon instanceof File
      ) {
        try {
          const formData = createFormData(providerData);
          const response = await api.post(
            '/app/components/providers/',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          showSuccessToast('LLM Provider created successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Creating LLM provider');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Creating LLM provider');
        throw jsonError;
      }
    }
  },

  // Update provider
  updateProvider: async (
    providerId: number,
    providerData: UpdateLLMProviderPayload
  ): Promise<UpdateLLMProviderResponse> => {
    try {
      // First try JSON payload
      const response = await api.put(
        `/app/components/providers/${providerId}/`,
        providerData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      showSuccessToast('LLM Provider updated successfully');
      return response.data;
    } catch (jsonError: any) {
      // If JSON fails and we have files, try FormData
      if (
        jsonError.response?.status === 400 &&
        providerData.icon instanceof File
      ) {
        try {
          const formData = createFormData(providerData);
          const response = await api.put(
            `/app/components/providers/${providerId}/`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          showSuccessToast('LLM Provider updated successfully');
          return response.data;
        } catch (error) {
          handleApiError(error, 'Updating LLM provider');
          throw error;
        }
      } else {
        handleApiError(jsonError, 'Updating LLM provider');
        throw jsonError;
      }
    }
  },

  // Delete provider
  deleteProvider: async (
    providerId: number
  ): Promise<DeleteLLMProviderResponse> => {
    try {
      await api.delete(`/app/components/providers/${providerId}/`);
      showSuccessToast('LLM Provider deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting LLM provider');
      throw error;
    }
  },

  // Test provider
  testProvider: async (
    providerId: number,
    testPrompt: string
  ): Promise<TestLLMProviderResponse> => {
    try {
      const response = await api.post(
        `/app/components/providers/${providerId}/test/`,
        {
          test_prompt: testPrompt,
        }
      );
      if (response.data.success) {
        showSuccessToast('Provider test completed successfully');
      }
      return response.data;
    } catch (error) {
      handleApiError(error, 'Testing LLM provider');
      throw error;
    }
  },

  // Toggle provider status
  toggleProvider: async (
    providerId: number
  ): Promise<UpdateLLMProviderResponse> => {
    try {
      const response = await api.patch(
        `/app/components/providers/${providerId}/toggle/`
      );
      showSuccessToast('Provider status updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Toggling provider status');
      throw error;
    }
  },
};
