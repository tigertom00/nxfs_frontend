import api from '../base';
import { handleApiError } from '../shared/error-handler';
import { DashboardStats, RecentActivity } from './types';

export const dashboardAPI = {
  // Get overall statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/app/memo/dashboard/stats/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting dashboard statistics');
      throw error;
    }
  },

  // Get recent activities
  getRecentActivities: async (): Promise<RecentActivity> => {
    try {
      const response = await api.get('/app/memo/dashboard/recent/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting recent activities');
      throw error;
    }
  },

  // Get quick access items
  getQuickAccess: async (): Promise<{
    popular_materials: Array<{
      id: number;
      el_nr: string;
      tittel: string;
      usage_count: number;
      leverandor_name: string;
    }>;
    favorite_materials: Array<{
      id: number;
      el_nr: string;
      tittel: string;
      leverandor_name: string;
    }>;
    active_jobs: Array<{
      ordre_nr: string;
      tittel: string;
      created_at: string;
    }>;
    popular_suppliers: Array<{
      id: number;
      navn: string;
      material_count: number;
    }>;
  }> => {
    try {
      const response = await api.get('/app/memo/dashboard/quick_access/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting quick access items');
      throw error;
    }
  },
};