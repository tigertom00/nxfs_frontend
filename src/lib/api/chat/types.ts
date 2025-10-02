import { PaginatedResponse } from '../shared/types';

/**
 * Chat API Types
 * Based on Django Channels + DRF real-time chat application
 */

/**
 * User information embedded in chat messages
 */
export interface ChatUser {
  id: string;
  email: string;
  display_name: string;
  profile_picture?: string;
  clerk_profile_image_url?: string;
}

/**
 * Chat room types
 */
export type RoomType = 'direct' | 'group' | 'project' | 'public';

/**
 * Message types
 */
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'typing';

/**
 * Chat room model
 */
export interface ChatRoom {
  id: string;
  name?: string;
  room_type: RoomType;
  participants: ChatUser[];
  created_by: ChatUser;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  direct_user1?: ChatUser;
  direct_user2?: ChatUser;
  last_message?: {
    id: string;
    content: string;
    sender: ChatUser;
    timestamp: string;
  };
  unread_count: number;
  other_user?: ChatUser; // For direct messages only
}

/**
 * Message model
 */
export interface Message {
  id: string;
  room: string;
  sender: ChatUser;
  content: string;
  message_type: MessageType;
  file_attachment?: string;
  file_name?: string;
  file_size?: number;
  timestamp: string;
  edited_at?: string;
  is_deleted: boolean;
  reply_to?: string;
  reactions: Record<string, string[]>; // { emoji: [user_id1, user_id2] }
  read_by: ChatUser[];
  is_edited: boolean;
}

/**
 * Typing indicator model
 */
export interface TypingIndicator {
  room: string;
  user: ChatUser;
  is_typing: boolean;
  last_seen: string;
}

/**
 * Chat session model
 */
export interface ChatSession {
  session_id: string;
  session_type: string;
  is_active: boolean;
  last_ping: string;
  connected_at: string;
  user_agent: string;
  ip_address: string;
}

/**
 * Request/Response types
 */

// Chat Rooms
export interface CreateChatRoomPayload {
  name?: string;
  room_type: RoomType;
  participant_ids: string[];
}

export interface CreateDirectMessagePayload {
  user_id: string;
}

export interface UpdateChatRoomPayload {
  name?: string;
  participant_ids?: string[];
}

export type GetChatRoomsResponse = PaginatedResponse<ChatRoom>;
export type GetChatRoomResponse = ChatRoom;
export type CreateChatRoomResponse = ChatRoom;
export type UpdateChatRoomResponse = ChatRoom;
export type CreateDirectMessageResponse = ChatRoom;

export interface MarkReadResponse {
  status: string;
  count: number;
}

export interface LeaveRoomResponse {
  status: string;
}

// Messages
export interface SendMessagePayload {
  content: string;
  message_type?: MessageType;
  reply_to?: string;
  file_attachment?: File;
}

export interface UpdateMessagePayload {
  content: string;
}

export interface ReactToMessagePayload {
  emoji: string;
  action: 'add' | 'remove';
}

export interface ReactToMessageResponse {
  reactions: Record<string, string[]>;
  message: string;
}

export interface MarkMessageReadResponse {
  status: string;
  was_already_read: boolean;
}

export type GetMessagesResponse = PaginatedResponse<Message>;
export type GetMessageResponse = Message;
export type SendMessageResponse = Message;
export type UpdateMessageResponse = Message;

// Search
export interface SearchMessagesParams {
  q: string;
  page?: number;
  page_size?: number;
}

export interface SearchRoomsParams {
  q: string;
  page?: number;
  page_size?: number;
}

export type SearchMessagesResponse = Message[];
export type SearchRoomsResponse = ChatRoom[];

// Sessions
export type GetActiveSessionsResponse = ChatSession[];

export interface CleanupSessionsResponse {
  status: string;
  deleted_sessions: number;
}

/**
 * WebSocket message types
 */

// Client -> Server
export interface WSMessagePayload {
  type: 'message';
  content: string;
  reply_to?: string;
}

export interface WSTypingPayload {
  type: 'typing';
  is_typing: boolean;
}

export interface WSReadReceiptPayload {
  type: 'read_receipt';
  message_id: string;
}

export type WSClientMessage =
  | WSMessagePayload
  | WSTypingPayload
  | WSReadReceiptPayload;

// Server -> Client
export interface WSMessageEvent {
  type: 'message';
  message: Message;
}

export interface WSTypingEvent {
  type: 'typing';
  user: string;
  user_id: string;
  is_typing: boolean;
}

export interface WSUserJoinedEvent {
  type: 'user_joined';
  user: string;
  user_id: string;
}

export interface WSUserLeftEvent {
  type: 'user_left';
  user: string;
  user_id: string;
}

export type WSServerMessage =
  | WSMessageEvent
  | WSTypingEvent
  | WSUserJoinedEvent
  | WSUserLeftEvent;
