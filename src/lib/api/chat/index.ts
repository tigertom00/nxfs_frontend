import api from '../base';
import type {
  ChatRoom,
  Message,
  CreateChatRoomPayload,
  CreateDirectMessagePayload,
  UpdateChatRoomPayload,
  SendMessagePayload,
  UpdateMessagePayload,
  ReactToMessagePayload,
  SearchMessagesParams,
  SearchRoomsParams,
  GetChatRoomsResponse,
  GetChatRoomResponse,
  CreateChatRoomResponse,
  UpdateChatRoomResponse,
  CreateDirectMessageResponse,
  MarkReadResponse,
  LeaveRoomResponse,
  GetMessagesResponse,
  GetMessageResponse,
  SendMessageResponse,
  UpdateMessageResponse,
  ReactToMessageResponse,
  MarkMessageReadResponse,
  SearchMessagesResponse,
  SearchRoomsResponse,
  GetActiveSessionsResponse,
  CleanupSessionsResponse,
  TypingIndicator,
} from './types';

/**
 * Chat API Client
 * Handles all chat-related API operations (REST endpoints)
 * WebSocket connections should be handled separately
 */

const BASE_PATH = '/chat';

/**
 * Chat Rooms
 */

/**
 * List user's chat rooms with pagination
 */
export const getChatRooms = async (
  page = 1,
  pageSize = 50
): Promise<GetChatRoomsResponse> => {
  const response = await api.get<GetChatRoomsResponse>(
    `${BASE_PATH}/rooms/`,
    {
      params: { page, page_size: pageSize },
    }
  );
  return response.data;
};

/**
 * Get a specific chat room by ID
 */
export const getChatRoom = async (
  roomId: string
): Promise<GetChatRoomResponse> => {
  const response = await api.get<GetChatRoomResponse>(
    `${BASE_PATH}/rooms/${roomId}/`
  );
  return response.data;
};

/**
 * Create a new chat room
 */
export const createChatRoom = async (
  payload: CreateChatRoomPayload
): Promise<CreateChatRoomResponse> => {
  const response = await api.post<CreateChatRoomResponse>(
    `${BASE_PATH}/rooms/`,
    payload
  );
  return response.data;
};

/**
 * Update a chat room
 */
export const updateChatRoom = async (
  roomId: string,
  payload: UpdateChatRoomPayload
): Promise<UpdateChatRoomResponse> => {
  const response = await api.patch<UpdateChatRoomResponse>(
    `${BASE_PATH}/rooms/${roomId}/`,
    payload
  );
  return response.data;
};

/**
 * Delete a chat room
 */
export const deleteChatRoom = async (roomId: string): Promise<void> => {
  await api.delete(`${BASE_PATH}/rooms/${roomId}/`);
};

/**
 * Create or get direct message room with another user
 */
export const createDirectMessage = async (
  payload: CreateDirectMessagePayload
): Promise<CreateDirectMessageResponse> => {
  const response = await api.post<CreateDirectMessageResponse>(
    `${BASE_PATH}/rooms/direct_message/`,
    payload
  );
  return response.data;
};

/**
 * Mark all messages in a room as read
 */
export const markRoomAsRead = async (
  roomId: string
): Promise<MarkReadResponse> => {
  const response = await api.post<MarkReadResponse>(
    `${BASE_PATH}/rooms/${roomId}/mark_read/`
  );
  return response.data;
};

/**
 * Get typing users in a room
 */
export const getTypingUsers = async (
  roomId: string
): Promise<TypingIndicator[]> => {
  const response = await api.get<TypingIndicator[]>(
    `${BASE_PATH}/rooms/${roomId}/typing_users/`
  );
  return response.data;
};

/**
 * Leave a chat room
 */
export const leaveRoom = async (roomId: string): Promise<LeaveRoomResponse> => {
  const response = await api.post<LeaveRoomResponse>(
    `${BASE_PATH}/rooms/${roomId}/leave/`
  );
  return response.data;
};

/**
 * Messages
 */

/**
 * List messages in a room with pagination
 */
export const getMessages = async (
  roomId: string,
  page = 1,
  pageSize = 50
): Promise<GetMessagesResponse> => {
  const response = await api.get<GetMessagesResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/`,
    {
      params: { page, page_size: pageSize },
    }
  );
  return response.data;
};

/**
 * Get a specific message
 */
export const getMessage = async (
  roomId: string,
  messageId: string
): Promise<GetMessageResponse> => {
  const response = await api.get<GetMessageResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/${messageId}/`
  );
  return response.data;
};

/**
 * Send a message in a room
 */
export const sendMessage = async (
  roomId: string,
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {
  // Handle file upload with FormData if file_attachment is present
  if (payload.file_attachment) {
    const formData = new FormData();
    formData.append('content', payload.content);
    formData.append('message_type', payload.message_type || 'file');
    if (payload.reply_to) {
      formData.append('reply_to', payload.reply_to);
    }
    formData.append('file_attachment', payload.file_attachment);

    const response = await api.post<SendMessageResponse>(
      `${BASE_PATH}/rooms/${roomId}/messages/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Text-only message
  const response = await api.post<SendMessageResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/`,
    payload
  );
  return response.data;
};

/**
 * Update a message
 */
export const updateMessage = async (
  roomId: string,
  messageId: string,
  payload: UpdateMessagePayload
): Promise<UpdateMessageResponse> => {
  const response = await api.patch<UpdateMessageResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/${messageId}/`,
    payload
  );
  return response.data;
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  roomId: string,
  messageId: string
): Promise<void> => {
  await api.delete(`${BASE_PATH}/rooms/${roomId}/messages/${messageId}/`);
};

/**
 * Add or remove reaction to a message
 */
export const reactToMessage = async (
  roomId: string,
  messageId: string,
  payload: ReactToMessagePayload
): Promise<ReactToMessageResponse> => {
  const response = await api.post<ReactToMessageResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/${messageId}/react/`,
    payload
  );
  return response.data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  roomId: string,
  messageId: string
): Promise<MarkMessageReadResponse> => {
  const response = await api.post<MarkMessageReadResponse>(
    `${BASE_PATH}/rooms/${roomId}/messages/${messageId}/mark_read/`
  );
  return response.data;
};

/**
 * Search
 */

/**
 * Search messages across all rooms
 */
export const searchMessages = async (
  params: SearchMessagesParams
): Promise<SearchMessagesResponse> => {
  const response = await api.get<SearchMessagesResponse>(
    `${BASE_PATH}/search/messages/`,
    { params }
  );
  return response.data;
};

/**
 * Search chat rooms
 */
export const searchRooms = async (
  params: SearchRoomsParams
): Promise<SearchRoomsResponse> => {
  const response = await api.get<SearchRoomsResponse>(
    `${BASE_PATH}/search/rooms/`,
    { params }
  );
  return response.data;
};

/**
 * Chat Sessions
 */

/**
 * Get active chat sessions for current user
 */
export const getActiveSessions =
  async (): Promise<GetActiveSessionsResponse> => {
    const response = await api.get<GetActiveSessionsResponse>(
      `${BASE_PATH}/sessions/active_sessions/`
    );
    return response.data;
  };

/**
 * Cleanup old inactive sessions
 */
export const cleanupOldSessions = async (): Promise<CleanupSessionsResponse> => {
  const response = await api.post<CleanupSessionsResponse>(
    `${BASE_PATH}/sessions/cleanup_old_sessions/`
  );
  return response.data;
};

/**
 * Export all chat API methods
 */
export const chatAPI = {
  // Rooms
  getChatRooms,
  getChatRoom,
  createChatRoom,
  updateChatRoom,
  deleteChatRoom,
  createDirectMessage,
  markRoomAsRead,
  getTypingUsers,
  leaveRoom,

  // Messages
  getMessages,
  getMessage,
  sendMessage,
  updateMessage,
  deleteMessage,
  reactToMessage,
  markMessageAsRead,

  // Search
  searchMessages,
  searchRooms,

  // Sessions
  getActiveSessions,
  cleanupOldSessions,
};

// Export types
export type * from './types';
