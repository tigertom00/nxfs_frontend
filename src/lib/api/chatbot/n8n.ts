import axios from 'axios';
import { env } from '../../env';
import { handleApiError } from '../shared/error-handler';
import { getAccessToken } from '../shared/utils';
import { SendMessagePayload, SendChatMessageResponse } from './types';

export const n8nAPI = {
  // Send message to N8N chatbot
  sendMessage: async (
    sessionId: string,
    chatInput: string,
    userName?: string
  ): Promise<SendChatMessageResponse> => {
    try {
      const accessToken = getAccessToken();
      const response = await axios.post(
        env.NEXT_PUBLIC_N8N_URL,
        {
          sessionId,
          action: 'sendMessage',
          chatInput,
          accessToken,
          userName,
        },
        {
          headers: {
            Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Sending chat message');
      throw error;
    }
  },

  // Send message with files to N8N chatbot
  sendMessageWithFiles: async (
    sessionId: string,
    chatInput: string,
    files?: File[],
    userName?: string
  ): Promise<SendChatMessageResponse> => {
    try {
      const accessToken = getAccessToken();
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('action', 'sendMessage');
      formData.append('chatInput', chatInput);

      if (accessToken) {
        formData.append('accessToken', accessToken);
      }
      if (userName) {
        formData.append('userName', userName);
      }

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      const response = await axios.post(env.NEXT_PUBLIC_N8N_URL, formData, {
        headers: {
          Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Sending chat message with files');
      throw error;
    }
  },

  // Generic send message that handles both text and files
  send: async (
    payload: SendMessagePayload
  ): Promise<SendChatMessageResponse> => {
    if (payload.files && payload.files.length > 0) {
      return n8nAPI.sendMessageWithFiles(
        payload.sessionId,
        payload.chatInput,
        payload.files,
        payload.userName
      );
    } else {
      return n8nAPI.sendMessage(
        payload.sessionId,
        payload.chatInput,
        payload.userName
      );
    }
  },

  // Health check for N8N service
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await axios.get(`${env.NEXT_PUBLIC_N8N_URL}/health`, {
        headers: {
          Authorization: env.NEXT_PUBLIC_N8N_SECRET_KEY,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Checking N8N health');
      throw error;
    }
  },
};
