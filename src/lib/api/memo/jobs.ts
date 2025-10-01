import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import { ChoiceItem } from '../shared/types';
import {
  Job,
  JobMaterial,
  JobSearchParams,
  NearbyJobsParams,
  CreateJobPayload,
  UpdateJobPayload,
  CreateJobMaterialPayload,
  GetJobsResponse,
  GetJobsPaginatedResponse,
  GetJobResponse,
  CreateJobResponse,
  UpdateJobResponse,
  GetJobMaterialsResponse,
  GetJobMaterialResponse,
  CreateJobMaterialResponse,
  RecentJobMaterial,
  GetRecentJobMaterialsParams,
  GetRecentJobMaterialsResponse,
} from './types';

export const jobsAPI = {
  // List jobs with search and pagination
  getJobs: async (
    params?: JobSearchParams
  ): Promise<GetJobsResponse | GetJobsPaginatedResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber/', params);
      const response = await api.get(url);

      // If response has pagination structure, return it as is
      if (
        response.data &&
        typeof response.data === 'object' &&
        'count' in response.data &&
        'results' in response.data
      ) {
        return response.data as GetJobsPaginatedResponse;
      }

      // Otherwise return as simple array
      return normalizeResponse<Job>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting jobs');
      throw error;
    }
  },

  // Get all jobs (backward compatibility)
  getAllJobs: async (): Promise<GetJobsResponse> => {
    try {
      const response = await api.get('/app/memo/jobber/');
      return normalizeResponse<Job>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting all jobs');
      throw error;
    }
  },

  // Get job by ordre_nr
  getJob: async (ordreNr: string): Promise<GetJobResponse> => {
    try {
      const response = await api.get(`/app/memo/jobber/${ordreNr}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job');
      throw error;
    }
  },

  // Job lookup by ordre_nr
  lookupJob: async (ordreNr: string): Promise<GetJobResponse> => {
    try {
      const response = await api.get(
        `/app/memo/jobber/lookup/?ordre_nr=${ordreNr}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Looking up job');
      throw error;
    }
  },

  // Job choices for dropdowns
  getJobChoices: async (params?: {
    search?: string;
    limit?: number;
    ferdig?: boolean;
  }): Promise<ChoiceItem[]> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber/choices/', {
        search: params?.search || '',
        limit: params?.limit || 50,
        ferdig: params?.ferdig,
      });
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job choices');
      throw error;
    }
  },

  // Create job
  createJob: async (jobData: CreateJobPayload): Promise<CreateJobResponse> => {
    try {
      const response = await api.post('/app/memo/jobber/', jobData);
      showSuccessToast('Job created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating job');
      throw error;
    }
  },

  // Update job
  updateJob: async (
    ordreNr: string,
    jobData: UpdateJobPayload
  ): Promise<UpdateJobResponse> => {
    try {
      const response = await api.patch(`/app/memo/jobber/${ordreNr}/`, jobData);
      showSuccessToast('Job updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating job');
      throw error;
    }
  },

  // Delete job
  deleteJob: async (ordreNr: string): Promise<void> => {
    try {
      await api.delete(`/app/memo/jobber/${ordreNr}/`);
      showSuccessToast('Job deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting job');
      throw error;
    }
  },

  // Add materials to job
  addMaterialsToJob: async (
    ordreNr: string,
    materials: Array<{
      matriell_id: number;
      antall: number;
      transf?: boolean;
    }>
  ): Promise<{
    message: string;
    materials: Array<{
      matriell_id: number;
      el_nr: string;
      tittel: string;
      antall: number;
      transf: boolean;
      action: string;
    }>;
    errors: string[];
    total_materials_in_job: number;
  }> => {
    try {
      const response = await api.post(
        `/app/memo/jobber/${ordreNr}/add_materials/`,
        {
          materials,
        }
      );
      showSuccessToast(`Added ${materials.length} materials to job ${ordreNr}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Adding materials to job');
      throw error;
    }
  },

  // Complete job
  completeJob: async (
    ordreNr: string,
    notes?: string
  ): Promise<{
    message: string;
    jobb: Job;
  }> => {
    try {
      const response = await api.post(`/app/memo/jobber/${ordreNr}/complete/`, {
        notes,
      });
      showSuccessToast(`Job ${ordreNr} completed successfully`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Completing job');
      throw error;
    }
  },

  // Get materials summary for job
  getMaterialsSummary: async (
    ordreNr: string
  ): Promise<{
    jobb: {
      ordre_nr: string;
      tittel: string;
      ferdig: boolean;
    };
    summary: {
      total_material_types: number;
      total_items: number;
      categories: number;
    };
    category_breakdown: Record<
      string,
      {
        count: number;
        items: number;
      }
    >;
    materials: JobMaterial[];
  }> => {
    try {
      const response = await api.get(
        `/app/memo/jobber/${ordreNr}/materials_summary/`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting materials summary');
      throw error;
    }
  },

  // Get nearby jobs based on user location (backend geocoding)
  getNearbyJobs: async (params: NearbyJobsParams): Promise<Job[]> => {
    try {
      console.log('[DEBUG] getNearbyJobs called with params:', params);
      const url = createUrlWithParams('/app/memo/jobber/nearby/', {
        lat: params.lat,
        lon: params.lon,
        radius: params.radius || 100,
        ferdig: params.ferdig,
      });
      console.log('[DEBUG] Making request to:', url);
      const response = await api.get(url);
      console.log('[DEBUG] Response received:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('[DEBUG] getNearbyJobs error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      handleApiError(error, 'Getting nearby jobs');
      throw error;
    }
  },

  // Get job heatmap data (all job locations)
  getJobHeatmap: async (params?: { ferdig?: boolean }): Promise<Array<{
    lat: number;
    lon: number;
    ordre_nr: string;
    tittel: string;
    ferdig: boolean;
  }>> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber/heatmap/', params);
      const response = await api.get(url);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      handleApiError(error, 'Getting job heatmap');
      throw error;
    }
  },
};

export const jobMaterialsAPI = {
  // List job materials
  getJobMaterials: async (params?: {
    jobb?: string;
    matriell_el_nr?: string;
    transf?: boolean;
    antall_min?: number;
    antall_max?: number;
  }): Promise<GetJobMaterialsResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobbmatriell/', params);
      const response = await api.get(url);
      return normalizeResponse<JobMaterial>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting job materials');
      throw error;
    }
  },

  // Get job material by ID
  getJobMaterial: async (id: number): Promise<GetJobMaterialResponse> => {
    try {
      const response = await api.get(`/app/memo/jobbmatriell/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting job material');
      throw error;
    }
  },

  // Create job material
  createJobMaterial: async (
    jobMaterialData: CreateJobMaterialPayload
  ): Promise<CreateJobMaterialResponse> => {
    try {
      const response = await api.post(
        '/app/memo/jobbmatriell/',
        jobMaterialData
      );
      showSuccessToast('Material added to job successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating job material');
      throw error;
    }
  },

  // Update job material
  updateJobMaterial: async (
    id: number,
    jobMaterialData: Partial<CreateJobMaterialPayload>
  ): Promise<CreateJobMaterialResponse> => {
    try {
      const response = await api.patch(
        `/app/memo/jobbmatriell/${id}/`,
        jobMaterialData
      );
      showSuccessToast('Job material updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating job material');
      throw error;
    }
  },

  // Delete job material
  deleteJobMaterial: async (id: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/jobbmatriell/${id}/`);
      showSuccessToast('Material removed from job successfully');
    } catch (error) {
      handleApiError(error, 'Deleting job material');
      throw error;
    }
  },

  // Get recent job materials
  getRecentJobMaterials: async (
    params?: GetRecentJobMaterialsParams
  ): Promise<GetRecentJobMaterialsResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobbmatriell/recent/', params);
      const response = await api.get(url);
      // Handle both array and object with results
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      return [];
    } catch (error) {
      handleApiError(error, 'Getting recent job materials');
      throw error;
    }
  },
};
