import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import {
  JobberTask,
  JobberTaskSearchParams,
  JobberTasksByJobResponse,
  CreateJobberTaskPayload,
  UpdateJobberTaskPayload,
  GetJobberTasksResponse,
  GetJobberTaskResponse,
  CreateJobberTaskResponse,
  UpdateJobberTaskResponse,
  ToggleJobberTaskCompleteResponse,
} from './types';

export const jobberTasksAPI = {
  // List tasks with optional filtering
  getTasks: async (
    params?: JobberTaskSearchParams
  ): Promise<GetJobberTasksResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber-tasks/', params);
      const response = await api.get(url);

      // If response has pagination structure, return it as is
      if (
        response.data &&
        typeof response.data === 'object' &&
        'count' in response.data &&
        'results' in response.data
      ) {
        return response.data;
      }

      // Otherwise return as simple array
      return normalizeResponse<JobberTask>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting jobber tasks');
      throw error;
    }
  },

  // Get tasks by completion status
  getTasksByStatus: async (
    completed: boolean
  ): Promise<GetJobberTasksResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber-tasks/', {
        completed,
      });
      const response = await api.get(url);

      if (
        response.data &&
        typeof response.data === 'object' &&
        'count' in response.data &&
        'results' in response.data
      ) {
        return response.data;
      }

      return normalizeResponse<JobberTask>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting tasks by status');
      throw error;
    }
  },

  // Get tasks for a specific job with stats
  getTasksByJob: async (
    jobbId: string | number
  ): Promise<JobberTasksByJobResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/jobber-tasks/by_job/', {
        jobb_id: jobbId,
      });
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting tasks by job');
      throw error;
    }
  },

  // Get single task by ID
  getTask: async (id: number): Promise<GetJobberTaskResponse> => {
    try {
      const response = await api.get(`/app/memo/jobber-tasks/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting jobber task');
      throw error;
    }
  },

  // Create new task
  createTask: async (
    taskData: CreateJobberTaskPayload
  ): Promise<CreateJobberTaskResponse> => {
    try {
      // Handle file upload if image is present
      let data: FormData | CreateJobberTaskPayload = taskData;

      if (taskData.image && taskData.image instanceof File) {
        const formData = new FormData();
        formData.append('title', taskData.title);
        if (taskData.notes) {
          formData.append('notes', taskData.notes);
        }
        if (taskData.completed !== undefined) {
          formData.append('completed', String(taskData.completed));
        }
        formData.append('jobb', String(taskData.jobb));
        formData.append('image', taskData.image);
        data = formData;
      }

      const response = await api.post('/app/memo/jobber-tasks/', data, {
        headers:
          data instanceof FormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
      });
      showSuccessToast('Task created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating jobber task');
      throw error;
    }
  },

  // Update task (PUT - full update)
  updateTask: async (
    id: number,
    taskData: CreateJobberTaskPayload
  ): Promise<UpdateJobberTaskResponse> => {
    try {
      // Handle file upload if image is present
      let data: FormData | CreateJobberTaskPayload = taskData;

      if (taskData.image && taskData.image instanceof File) {
        const formData = new FormData();
        formData.append('title', taskData.title);
        if (taskData.notes) {
          formData.append('notes', taskData.notes);
        }
        if (taskData.completed !== undefined) {
          formData.append('completed', String(taskData.completed));
        }
        formData.append('jobb', String(taskData.jobb));
        formData.append('image', taskData.image);
        data = formData;
      }

      const response = await api.put(`/app/memo/jobber-tasks/${id}/`, data, {
        headers:
          data instanceof FormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
      });
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating jobber task');
      throw error;
    }
  },

  // Partial update task (PATCH)
  patchTask: async (
    id: number,
    taskData: UpdateJobberTaskPayload
  ): Promise<UpdateJobberTaskResponse> => {
    try {
      // Handle file upload if image is present
      let data: FormData | UpdateJobberTaskPayload = taskData;

      if (taskData.image && taskData.image instanceof File) {
        const formData = new FormData();
        if (taskData.title) {
          formData.append('title', taskData.title);
        }
        if (taskData.notes) {
          formData.append('notes', taskData.notes);
        }
        if (taskData.completed !== undefined) {
          formData.append('completed', String(taskData.completed));
        }
        if (taskData.jobb) {
          formData.append('jobb', String(taskData.jobb));
        }
        formData.append('image', taskData.image);
        data = formData;
      }

      const response = await api.patch(`/app/memo/jobber-tasks/${id}/`, data, {
        headers:
          data instanceof FormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
      });
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating jobber task');
      throw error;
    }
  },

  // Delete task
  deleteTask: async (id: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/jobber-tasks/${id}/`);
      showSuccessToast('Task deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting jobber task');
      throw error;
    }
  },

  // Toggle task completion status
  toggleComplete: async (
    id: number
  ): Promise<ToggleJobberTaskCompleteResponse> => {
    try {
      const response = await api.post(
        `/app/memo/jobber-tasks/${id}/toggle_complete/`
      );
      const isCompleted = response.data.task?.completed;
      showSuccessToast(
        isCompleted ? 'Task marked as completed' : 'Task marked as incomplete'
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Toggling task completion');
      throw error;
    }
  },
};
