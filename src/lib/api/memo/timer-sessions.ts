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
};
