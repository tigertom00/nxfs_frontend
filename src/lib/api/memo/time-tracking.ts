import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import { createUrlWithParams, normalizeResponse } from '../shared/utils';
import {
  TimeEntry,
  TimeEntrySearchParams,
  CreateTimeEntryPayload,
  UpdateTimeEntryPayload,
  GetTimeEntriesResponse,
  GetTimeEntryResponse,
  CreateTimeEntryResponse,
  UpdateTimeEntryResponse,
  UserTimeStats,
  DateGroupedTimeEntries,
  GetTimeEntriesByDateParams,
} from './types';

export const timeTrackingAPI = {
  // List time entries with search and filtering
  getTimeEntries: async (
    params?: TimeEntrySearchParams
  ): Promise<GetTimeEntriesResponse> => {
    try {
      const url = createUrlWithParams('/app/memo/timeliste/', params);
      const response = await api.get(url);
      return normalizeResponse<TimeEntry>(response.data);
    } catch (error) {
      handleApiError(error, 'Getting time entries');
      throw error;
    }
  },

  // Get time entry by ID
  getTimeEntry: async (entryId: number): Promise<GetTimeEntryResponse> => {
    try {
      const response = await api.get(`/app/memo/timeliste/${entryId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting time entry');
      throw error;
    }
  },

  // Create time entry
  createTimeEntry: async (
    entryData: CreateTimeEntryPayload
  ): Promise<CreateTimeEntryResponse> => {
    try {
      const response = await api.post('/app/memo/timeliste/', entryData);
      showSuccessToast('Time entry created successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating time entry');
      throw error;
    }
  },

  // Update time entry
  updateTimeEntry: async (
    entryId: number,
    entryData: UpdateTimeEntryPayload
  ): Promise<UpdateTimeEntryResponse> => {
    try {
      const response = await api.patch(
        `/app/memo/timeliste/${entryId}/`,
        entryData
      );
      showSuccessToast('Time entry updated successfully');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating time entry');
      throw error;
    }
  },

  // Delete time entry
  deleteTimeEntry: async (entryId: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/timeliste/${entryId}/`);
      showSuccessToast('Time entry deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting time entry');
      throw error;
    }
  },

  // Get user time statistics
  getUserStats: async (): Promise<UserTimeStats> => {
    try {
      const response = await api.get('/app/memo/timeliste/user_stats/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting user time statistics');
      throw error;
    }
  },

  // Get time entries grouped by date
  getTimeEntriesByDate: async (
    params?: GetTimeEntriesByDateParams
  ): Promise<DateGroupedTimeEntries> => {
    try {
      const url = createUrlWithParams('/app/memo/timeliste/by_date/', params);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Getting time entries by date');
      throw error;
    }
  },
};
