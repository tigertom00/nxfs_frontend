import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  createUrlWithParams,
  createFormData,
  normalizeResponse,
} from '../shared/utils';
import {
  Task,
  TaskImage,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskSearchParams,
  GetTasksResponse,
  GetTaskResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  UploadTaskImageResponse,
  DeleteTaskImageResponse,
} from './types';

export const tasksAPI = {
  // Get all tasks
  getTasks: async (params?: TaskSearchParams): Promise<GetTasksResponse> => {
    try {
      let allTasks: Task[] = [];
      let nextUrl: string | null = createUrlWithParams('/app/tasks/tasks/', params);

      // Fetch all pages
      while (nextUrl) {
        console.log('Fetching tasks from:', nextUrl);
        const response = await api.get(nextUrl);
        console.log('Raw tasks API response:', response.data);

        // Extract tasks from current page
        const currentPageTasks = Array.isArray(response.data)
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];

        allTasks = [...allTasks, ...currentPageTasks];

        // Check if there's a next page
        nextUrl = response.data?.next || null;

        console.log(`Page loaded: ${currentPageTasks.length} tasks, Total so far: ${allTasks.length}`);
        if (nextUrl) {
          console.log('Next page available:', nextUrl);
        }
      }

      console.log('Final tasks array (all pages):', allTasks);
      console.log(`Total tasks loaded: ${allTasks.length}`);
      return allTasks;
    } catch (error) {
      handleApiError(error, 'Getting tasks');
      throw error;
    }
  },

  // Get single task by ID
  getTask: async (taskId: string): Promise<GetTaskResponse> => {
    try {
      const response = await api.get(`/app/tasks/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting task');
      throw error;
    }
  },

  // Create new task
  createTask: async (
    taskData: CreateTaskPayload
  ): Promise<CreateTaskResponse> => {
    try {
      const formData = createFormData(taskData);
      const response = await api.post('/app/tasks/tasks/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Task created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating task');
      throw error;
    }
  },

  // Update existing task
  updateTask: async (
    taskId: string,
    taskData: UpdateTaskPayload
  ): Promise<UpdateTaskResponse> => {
    try {
      const formData = createFormData(taskData);
      const response = await api.put(`/app/tasks/tasks/${taskId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating task');
      throw error;
    }
  },

  // Patch task (partial update)
  patchTask: async (
    taskId: string,
    taskData: UpdateTaskPayload
  ): Promise<UpdateTaskResponse> => {
    try {
      const formData = createFormData(taskData);
      const response = await api.patch(
        `/app/tasks/tasks/${taskId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Task updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating task');
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<DeleteTaskResponse> => {
    try {
      await api.delete(`/app/tasks/tasks/${taskId}/`);
      showSuccessToast('Task deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting task');
      throw error;
    }
  },

  // Task status management
  markAsCompleted: async (taskId: string): Promise<UpdateTaskResponse> => {
    try {
      const response = await api.patch(`/app/tasks/tasks/${taskId}/`, {
        status: 'completed',
        completed: true,
      });
      showSuccessToast('Task marked as completed');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking task as completed');
      throw error;
    }
  },

  markAsInProgress: async (taskId: string): Promise<UpdateTaskResponse> => {
    try {
      const response = await api.patch(`/app/tasks/tasks/${taskId}/`, {
        status: 'in_progress',
        completed: false,
      });
      showSuccessToast('Task marked as in progress');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking task as in progress');
      throw error;
    }
  },

  markAsTodo: async (taskId: string): Promise<UpdateTaskResponse> => {
    try {
      const response = await api.patch(`/app/tasks/tasks/${taskId}/`, {
        status: 'todo',
        completed: false,
      });
      showSuccessToast('Task marked as todo');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking task as todo');
      throw error;
    }
  },

  // Image management
  uploadImage: async (
    taskId: string,
    image: File
  ): Promise<UploadTaskImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(
        `/app/tasks/tasks/${taskId}/upload_image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Image uploaded successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading task image');
      throw error;
    }
  },

  deleteImage: async (
    taskId: string,
    imageId: string
  ): Promise<DeleteTaskImageResponse> => {
    try {
      await api.delete(`/app/tasks/tasks/${taskId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting task image');
      throw error;
    }
  },

  // Get task images
  getImages: async (taskId: string): Promise<TaskImage[]> => {
    try {
      const response = await api.get(`/app/tasks/tasks/${taskId}/images/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting task images');
      throw error;
    }
  },

  // Bulk operations
  bulkUpdateStatus: async (
    taskIds: string[],
    status: 'todo' | 'in_progress' | 'completed'
  ): Promise<void> => {
    try {
      await api.post('/app/tasks/tasks/bulk-update-status/', {
        task_ids: taskIds,
        status,
      });
      showSuccessToast(`${taskIds.length} tasks updated successfully`);
    } catch (error) {
      handleApiError(error, 'Bulk updating task status');
      throw error;
    }
  },

  bulkDelete: async (taskIds: string[]): Promise<void> => {
    try {
      await api.post('/app/tasks/tasks/bulk-delete/', {
        task_ids: taskIds,
      });
      showSuccessToast(`${taskIds.length} tasks deleted successfully`);
    } catch (error) {
      handleApiError(error, 'Bulk deleting tasks');
      throw error;
    }
  },

  // Duplicate task
  duplicateTask: async (taskId: string): Promise<CreateTaskResponse> => {
    try {
      const response = await api.post(`/app/tasks/tasks/${taskId}/duplicate/`);
      showSuccessToast('Task duplicated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Duplicating task');
      throw error;
    }
  },
};
