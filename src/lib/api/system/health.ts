import api from '../base';
import { HealthStatus, PerformanceMetrics } from '../shared/types';

export const healthAPI = {
  // Public health check
  async getHealth(): Promise<HealthStatus> {
    const response = await api.get('/api/health/');
    return response.data;
  },

  // Admin performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await api.get('/api/admin/metrics/');
    return response.data;
  },
};

export default healthAPI;