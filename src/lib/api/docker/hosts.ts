import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  DockerHost,
  CreateHostPayload,
  UpdateHostPayload,
  GetDockerHostsResponse,
  GetDockerHostResponse,
  CreateDockerHostResponse,
  UpdateDockerHostResponse,
  DeleteDockerHostResponse,
  SyncContainersResponse,
} from './types';

export const hostsAPI = {
  // Get all hosts
  getHosts: async (): Promise<GetDockerHostsResponse> => {
    try {
      const response = await api.get('/api/docker/hosts/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting Docker hosts');
      throw error;
    }
  },

  // Get single host
  getHost: async (hostId: number): Promise<GetDockerHostResponse> => {
    try {
      const response = await api.get(`/api/docker/hosts/${hostId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting Docker host');
      throw error;
    }
  },

  // Create host
  createHost: async (hostData: CreateHostPayload): Promise<CreateDockerHostResponse> => {
    try {
      const response = await api.post('/api/docker/hosts/', hostData);
      showSuccessToast('Docker host created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating Docker host');
      throw error;
    }
  },

  // Update host
  updateHost: async (
    hostId: number,
    hostData: UpdateHostPayload
  ): Promise<UpdateDockerHostResponse> => {
    try {
      const response = await api.put(`/api/docker/hosts/${hostId}/`, hostData);
      showSuccessToast('Docker host updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating Docker host');
      throw error;
    }
  },

  // Delete host
  deleteHost: async (hostId: number): Promise<DeleteDockerHostResponse> => {
    try {
      await api.delete(`/api/docker/hosts/${hostId}/`);
      showSuccessToast('Docker host deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting Docker host');
      throw error;
    }
  },

  // Sync containers for a specific host
  syncContainers: async (hostId: number): Promise<SyncContainersResponse> => {
    try {
      const response = await api.post(`/api/docker/hosts/${hostId}/sync_containers/`);
      showSuccessToast('Container sync initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Syncing containers');
      throw error;
    }
  },

  // Test host connection
  testConnection: async (hostId: number): Promise<{ status: string; message: string }> => {
    try {
      const response = await api.post(`/api/docker/hosts/${hostId}/test_connection/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Testing host connection');
      throw error;
    }
  },
};