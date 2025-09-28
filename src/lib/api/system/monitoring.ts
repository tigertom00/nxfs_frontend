import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams } from '../shared/utils';
import {
  SystemStatsQuery,
  GetSystemStatsResponse,
  GetSystemStatResponse,
  GetLatestSystemStatsResponse,
  GetSystemDashboardResponse,
  GetHostSystemDashboardResponse,
  PostSystemCollectResponse,
} from './types';

export const monitoringAPI = {
  // System stats endpoints
  getSystemStats: async (params?: SystemStatsQuery): Promise<GetSystemStatsResponse> => {
    try {
      const url = createUrlWithParams('/api/docker/system-stats/', params);
      const response = await api.get(url);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      handleApiError(error, 'Getting system stats');
      throw error;
    }
  },

  getSystemStat: async (statId: number): Promise<GetSystemStatResponse> => {
    try {
      const response = await api.get(`/api/docker/system-stats/${statId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting system stat');
      throw error;
    }
  },

  getLatestSystemStats: async (): Promise<GetLatestSystemStatsResponse> => {
    try {
      const response = await api.get('/api/docker/system-stats/latest/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting latest system stats');
      throw error;
    }
  },

  // Dashboard endpoints
  getSystemDashboard: async (): Promise<GetSystemDashboardResponse> => {
    try {
      const response = await api.get('/api/system/dashboard/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting system dashboard');
      throw error;
    }
  },

  getHostSystemDashboard: async (
    hostId: number
  ): Promise<GetHostSystemDashboardResponse> => {
    try {
      const response = await api.get(`/api/system/dashboard/${hostId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting host system dashboard');
      throw error;
    }
  },

  // Collection endpoints
  collectSystemStats: async (): Promise<PostSystemCollectResponse> => {
    try {
      const response = await api.post('/api/system/collect/');
      showSuccessToast('System stats collection initiated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Collecting system stats');
      throw error;
    }
  },
};