import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams } from '../shared/utils';
import { Job, Material, TimeEntry, JobMaterial, DashboardStats } from './types';

// Report types
export interface JobCompletionReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_jobs: number;
    completed_jobs: number;
    active_jobs: number;
    completion_rate: number;
    total_hours: number;
    average_completion_time: number;
  };
  jobs_by_status: {
    completed: Job[];
    active: Job[];
  };
  trends: {
    daily_completions: Array<{
      date: string;
      completed: number;
      started: number;
    }>;
  };
}

export interface MaterialUsageReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_materials_used: number;
    unique_materials: number;
    total_cost: number;
    most_used_category: string;
  };
  top_materials: Array<{
    material: Material;
    usage_count: number;
    total_quantity: number;
    jobs_used_in: number;
  }>;
  usage_by_category: Array<{
    category: string;
    material_count: number;
    usage_count: number;
  }>;
  cost_analysis: Array<{
    material_id: number;
    material_name: string;
    total_cost: number;
    usage_count: number;
    cost_per_use: number;
  }>;
}

export interface TimeTrackingReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_hours: number;
    total_entries: number;
    average_daily_hours: number;
    most_productive_day: string;
  };
  time_by_job: Array<{
    job: Job;
    total_hours: number;
    entries_count: number;
    efficiency_score: number;
  }>;
  time_by_user: Array<{
    user_id: number;
    user_name: string;
    total_hours: number;
    entries_count: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    hours: number;
    entries: number;
  }>;
}

export interface CustomReportParams {
  report_type: 'jobs' | 'materials' | 'time' | 'comprehensive';
  start_date: string;
  end_date: string;
  filters?: {
    job_status?: 'active' | 'completed';
    material_categories?: string[];
    suppliers?: number[];
    users?: number[];
  };
  group_by?: 'date' | 'category' | 'supplier' | 'user';
  metrics?: string[];
  export_format?: 'json' | 'csv' | 'pdf';
}

export const reportsAPI = {
  // Generate job completion report
  getJobCompletionReport: async (
    startDate: string,
    endDate: string
  ): Promise<JobCompletionReport> => {
    try {
      const params = { start_date: startDate, end_date: endDate };
      const url = createUrlWithParams(
        '/app/memo/reports/job_completion/',
        params
      );
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job completion report');
      throw error;
    }
  },

  // Generate material usage report
  getMaterialUsageReport: async (
    startDate: string,
    endDate: string
  ): Promise<MaterialUsageReport> => {
    try {
      const params = { start_date: startDate, end_date: endDate };
      const url = createUrlWithParams(
        '/app/memo/reports/material_usage/',
        params
      );
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting material usage report');
      throw error;
    }
  },

  // Generate time tracking report
  getTimeTrackingReport: async (
    startDate: string,
    endDate: string
  ): Promise<TimeTrackingReport> => {
    try {
      const params = { start_date: startDate, end_date: endDate };
      const url = createUrlWithParams(
        '/app/memo/reports/time_tracking/',
        params
      );
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting time tracking report');
      throw error;
    }
  },

  // Generate custom report
  generateCustomReport: async (params: CustomReportParams): Promise<any> => {
    try {
      const response = await api.post('/app/memo/reports/custom/', params);
      showSuccessToast('Custom report generated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Generating custom report');
      throw error;
    }
  },

  // Export report data
  exportReport: async (
    reportType: string,
    reportData: any,
    format: 'csv' | 'pdf' | 'excel' = 'csv'
  ): Promise<Blob> => {
    try {
      const response = await api.post(
        '/app/memo/reports/export/',
        {
          report_type: reportType,
          data: reportData,
          format,
        },
        {
          responseType: 'blob',
        }
      );
      showSuccessToast(`Report exported as ${format.toUpperCase()}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Exporting report');
      throw error;
    }
  },

  // Get available report templates
  getReportTemplates: async (): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      parameters: any;
    }>
  > => {
    try {
      const response = await api.get('/app/memo/reports/templates/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting report templates');
      throw error;
    }
  },

  // Generate comprehensive dashboard export
  exportDashboardData: async (
    format: 'csv' | 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> => {
    try {
      const response = await api.get('/app/memo/reports/dashboard_export/', {
        params: { format },
        responseType: 'blob',
      });
      showSuccessToast('Dashboard data exported successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Exporting dashboard data');
      throw error;
    }
  },
};
