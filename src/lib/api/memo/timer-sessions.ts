import api from '../base';
import { handleApiError, showSuccessToast } from '../shared/error-handler';
import {
  ActiveTimerSession,
  StartTimerSessionPayload,
  StopTimerSessionPayload,
  StartTimerSessionResponse,
  GetActiveTimerSessionResponse,
  StopTimerSessionResponse,
} from './types';

/**
 * Timer Session API
 *
 * Manages active timer sessions on the server for reliable cross-device time tracking.
 * The server maintains the source of truth for timer start times and calculates elapsed time.
 */
export const timerSessionAPI = {
  /**
   * Start a new timer session
   * Creates an active timer session on the server
   * Note: Backend enforces one active session per user (OneToOneField)
   */
  startTimerSession: async (
    payload: StartTimerSessionPayload
  ): Promise<StartTimerSessionResponse> => {
    try {
      const response = await api.post('/app/memo/timer/start/', payload);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Starting timer session');
      throw error;
    }
  },

  /**
   * Stop an active timer session
   * This will:
   * 1. Calculate total elapsed time
   * 2. Create a time entry (Timeliste) with the hours
   * 3. Delete the active session
   */
  stopTimerSession: async (
    sessionId: number,
    payload?: StopTimerSessionPayload
  ): Promise<StopTimerSessionResponse> => {
    try {
      const response = await api.post(
        `/app/memo/timer/${sessionId}/stop/`,
        payload || {}
      );
      showSuccessToast('Timer stopped and time entry created');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Stopping timer session');
      throw error;
    }
  },

  /**
   * Get the current user's active timer session
   * Returns null if no active session exists
   */
  getActiveTimerSession: async (): Promise<GetActiveTimerSessionResponse> => {
    try {
      const response = await api.get('/app/memo/timer/active/');
      return response.data;
    } catch (error) {
      // Don't show error toast - this is called frequently
      throw error;
    }
  },

  /**
   * Ping the timer session to update last_ping timestamp
   * This serves as a heartbeat to keep the session alive
   * Should be called periodically (e.g., every 30 seconds)
   */
  pingTimerSession: async (sessionId: number): Promise<ActiveTimerSession> => {
    try {
      const response = await api.patch(`/app/memo/timer/${sessionId}/ping/`, {});
      return response.data;
    } catch (error) {
      // Don't show error toast - this is a background operation
      throw error;
    }
  },

  /**
   * Delete an active timer session without creating a time entry
   * Used when user wants to discard the timer
   */
  deleteTimerSession: async (sessionId: number): Promise<void> => {
    try {
      await api.delete(`/app/memo/timer/${sessionId}/`);
      showSuccessToast('Timer deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting timer session');
      throw error;
    }
  },

  /**
   * Pause an active timer session
   * Marks the timer as paused and records the timestamp
   */
  pauseTimerSession: async (sessionId: number): Promise<ActiveTimerSession> => {
    try {
      const response = await api.post(`/app/memo/timer/${sessionId}/pause/`, {});
      showSuccessToast('Timer paused');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Pausing timer session');
      throw error;
    }
  },

  /**
   * Resume a paused timer session
   * Accumulates pause duration and resumes counting
   */
  resumeTimerSession: async (sessionId: number): Promise<ActiveTimerSession> => {
    try {
      const response = await api.post(`/app/memo/timer/${sessionId}/resume/`, {});
      showSuccessToast('Timer resumed');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Resuming timer session');
      throw error;
    }
  },
};
