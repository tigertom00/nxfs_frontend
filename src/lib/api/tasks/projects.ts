import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  createUrlWithParams,
  createFormData,
  normalizeResponse,
} from '../shared/utils';
import {
  Project,
  ProjectImage,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectSearchParams,
  GetProjectsResponse,
  GetProjectResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  UploadProjectImageResponse,
  DeleteProjectImageResponse,
} from './types';

export const projectsAPI = {
  // Get all projects
  getProjects: async (
    params?: ProjectSearchParams
  ): Promise<GetProjectsResponse> => {
    try {
      const url = createUrlWithParams('/app/tasks/projects/', params);
      const response = await api.get(url);

      // Handle both paginated and array responses
      const normalized = normalizeResponse<Project>(response.data);
      return Array.isArray(normalized) ? normalized : normalized;
    } catch (error) {
      handleApiError(error, 'Getting projects');
      throw error;
    }
  },

  // Get single project by ID
  getProject: async (projectId: string): Promise<GetProjectResponse> => {
    try {
      const response = await api.get(`/app/tasks/projects/${projectId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting project');
      throw error;
    }
  },

  // Create new project
  createProject: async (
    projectData: CreateProjectPayload
  ): Promise<CreateProjectResponse> => {
    try {
      const formData = createFormData(projectData);
      const response = await api.post('/app/tasks/projects/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccessToast('Project created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating project');
      throw error;
    }
  },

  // Update existing project
  updateProject: async (
    projectId: string,
    projectData: UpdateProjectPayload
  ): Promise<UpdateProjectResponse> => {
    try {
      const formData = createFormData(projectData);
      const response = await api.put(
        `/app/tasks/projects/${projectId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showSuccessToast('Project updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating project');
      throw error;
    }
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<DeleteProjectResponse> => {
    try {
      await api.delete(`/app/tasks/projects/${projectId}/`);
      showSuccessToast('Project deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting project');
      throw error;
    }
  },

  // Project status management
  markAsCompleted: async (
    projectId: string
  ): Promise<UpdateProjectResponse> => {
    try {
      const response = await api.patch(`/app/tasks/projects/${projectId}/`, {
        status: 'completed',
        completed: true,
        completed_at: new Date().toISOString(),
      });
      showSuccessToast('Project marked as completed');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking project as completed');
      throw error;
    }
  },

  markAsInProgress: async (
    projectId: string
  ): Promise<UpdateProjectResponse> => {
    try {
      const response = await api.patch(`/app/tasks/projects/${projectId}/`, {
        status: 'in_progress',
        completed: false,
      });
      showSuccessToast('Project marked as in progress');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking project as in progress');
      throw error;
    }
  },

  markAsTodo: async (projectId: string): Promise<UpdateProjectResponse> => {
    try {
      const response = await api.patch(`/app/tasks/projects/${projectId}/`, {
        status: 'todo',
        completed: false,
      });
      showSuccessToast('Project marked as todo');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Marking project as todo');
      throw error;
    }
  },

  // Task management within projects
  addTaskToProject: async (
    projectId: string,
    taskId: number
  ): Promise<UpdateProjectResponse> => {
    try {
      const response = await api.post(
        `/app/tasks/projects/${projectId}/add-task/`,
        { task_id: taskId }
      );
      showSuccessToast('Task added to project');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Adding task to project');
      throw error;
    }
  },

  removeTaskFromProject: async (
    projectId: string,
    taskId: number
  ): Promise<UpdateProjectResponse> => {
    try {
      const response = await api.post(
        `/app/tasks/projects/${projectId}/remove-task/`,
        { task_id: taskId }
      );
      showSuccessToast('Task removed from project');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Removing task from project');
      throw error;
    }
  },

  // Image management
  uploadImage: async (
    projectId: string,
    image: File
  ): Promise<UploadProjectImageResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post(
        `/app/tasks/projects/${projectId}/upload_image/`,
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
      handleApiError(error, 'Uploading project image');
      throw error;
    }
  },

  deleteImage: async (
    projectId: string,
    imageId: string
  ): Promise<DeleteProjectImageResponse> => {
    try {
      await api.delete(`/app/tasks/projects/${projectId}/images/${imageId}/`);
      showSuccessToast('Image deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting project image');
      throw error;
    }
  },

  // Get project images
  getImages: async (projectId: string): Promise<ProjectImage[]> => {
    try {
      const response = await api.get(
        `/app/tasks/projects/${projectId}/images/`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting project images');
      throw error;
    }
  },

  // Project statistics
  getProjectStats: async (
    projectId: string
  ): Promise<{
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    completion_percentage: number;
  }> => {
    try {
      const response = await api.get(`/app/tasks/projects/${projectId}/stats/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting project statistics');
      throw error;
    }
  },

  // Duplicate project
  duplicateProject: async (
    projectId: string
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await api.post(
        `/app/tasks/projects/${projectId}/duplicate/`
      );
      showSuccessToast('Project duplicated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Duplicating project');
      throw error;
    }
  },
};
