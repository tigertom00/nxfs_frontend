import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createFormData } from '../shared/utils';
import {
  GetCurrentUserResponse,
  UpdateUserPayload,
  UpdateUserResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from './types';

export const usersAPI = {
  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    try {
      const response = await api.get('/api/user/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting current user');
      throw error;
    }
  },

  updateUser: async (
    userId: string,
    userData: UpdateUserPayload
  ): Promise<UpdateUserResponse> => {
    try {
      let response: any;

      // Check if we have file uploads
      const hasFiles = userData.profile_picture instanceof File;

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = createFormData(userData);
        response = await api.put(`/api/user/${userId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Use JSON for regular updates
        response = await api.put(`/api/user/${userId}/`, userData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      showSuccessToast('User profile updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating user profile');
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/api/user/${userId}/`);
      showSuccessToast('User account deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting user account');
      throw error;
    }
  },

  changePassword: async (
    userId: string,
    passwordData: ChangePasswordPayload
  ): Promise<ChangePasswordResponse> => {
    try {
      const response = await api.post(
        `/api/user/${userId}/change_password/`,
        passwordData
      );
      showSuccessToast('Password changed successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Changing password');
      throw error;
    }
  },

  uploadProfilePicture: async (
    userId: string,
    image: File
  ): Promise<UpdateUserResponse> => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', image);

      const response = await api.patch(`/api/user/${userId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showSuccessToast('Profile picture updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Uploading profile picture');
      throw error;
    }
  },

  removeProfilePicture: async (userId: string): Promise<UpdateUserResponse> => {
    try {
      const response = await api.patch(`/api/user/${userId}/`, {
        profile_picture: null,
      });

      showSuccessToast('Profile picture removed successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Removing profile picture');
      throw error;
    }
  },
};