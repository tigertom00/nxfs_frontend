import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import {
  DockerContainer,
  ContainerSearchParams,
  StatsSearchParams,
  ContainerActionPayload,
  GetDockerContainersResponse,
  GetDockerContainerResponse,
  GetRunningContainersResponse,
  GetContainerStatsResponse,
  RefreshStatsResponse,
  ContainerActionResponse,
} from './types';

export const containersAPI = {
  // Get all containers
  getContainers: async (
    params?: ContainerSearchParams
  ): Promise<GetDockerContainersResponse> => {
    try {
      const url = createUrlWithParams('/api/docker/containers/', params);
      const response = await api.get(url);

      // Handle both paginated and array responses
      const normalized = normalizeResponse<DockerContainer>(response.data);
      return Array.isArray(normalized) ? normalized : normalized.results || [];
    } catch (error) {
      handleApiError(error, 'Getting Docker containers');
      throw error;
    }
  },

  // Get single container
  getContainer: async (
    containerId: string
  ): Promise<GetDockerContainerResponse> => {
    try {
      const response = await api.get(`/api/docker/containers/${containerId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting Docker container');
      throw error;
    }
  },

  // Get running containers
  getRunningContainers: async (): Promise<GetRunningContainersResponse> => {
    try {
      const response = await api.get('/api/docker/containers/running/');

      // Handle both paginated and array responses
      const normalized = normalizeResponse<DockerContainer>(response.data);
      return Array.isArray(normalized) ? normalized : normalized.results || [];
    } catch (error) {
      handleApiError(error, 'Getting running containers');
      throw error;
    }
  },

  // Get container stats
  getContainerStats: async (
    containerId: string,
    params?: StatsSearchParams
  ): Promise<GetContainerStatsResponse> => {
    try {
      const url = createUrlWithParams(
        `/api/docker/containers/${containerId}/stats/`,
        params
      );
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting container stats');
      throw error;
    }
  },

  // Container actions
  performAction: async (
    containerId: string,
    actionData: ContainerActionPayload
  ): Promise<ContainerActionResponse> => {
    try {
      const response = await api.post(
        `/api/docker/containers/${containerId}/action/`,
        actionData
      );
      showSuccessToast(`Container ${actionData.action} completed successfully`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Performing container ${actionData.action}`);
      throw error;
    }
  },

  // Refresh stats for all containers
  refreshStats: async (): Promise<RefreshStatsResponse> => {
    try {
      const response = await api.post('/api/docker/containers/refresh_stats/');
      showSuccessToast('Stats refresh initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Refreshing container stats');
      throw error;
    }
  },

  // Get container logs
  getLogs: async (
    containerId: string,
    params?: { lines?: number; since?: string; until?: string }
  ): Promise<{ logs: string }> => {
    try {
      const url = createUrlWithParams(
        `/api/docker/containers/${containerId}/logs/`,
        params
      );
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting container logs');
      throw error;
    }
  },
};
