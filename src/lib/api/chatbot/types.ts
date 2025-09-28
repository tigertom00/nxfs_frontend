// Chatbot types
export interface ChatbotResponse {
  output: string; // N8N returns 'output' field
  response?: string; // Fallback field name
  session_id: string;
  message_id?: string;
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  session_id: string;
  files?: ChatFile[];
}

export interface ChatFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

// Request payloads
export interface SendMessagePayload {
  sessionId: string;
  chatInput: string;
  userName?: string;
  files?: File[];
}

export interface CreateSessionPayload {
  title?: string;
  user_id: string;
}

export interface UpdateSessionPayload {
  title?: string;
}

// Response types
export type SendChatMessageResponse = ChatbotResponse;
export type GetChatSessionsResponse = ChatSession[];
export type GetChatSessionResponse = ChatSession;
export type CreateChatSessionResponse = ChatSession;
export type UpdateChatSessionResponse = ChatSession;
export type DeleteChatSessionResponse = void;
export type GetChatMessagesResponse = ChatMessage[];
export type GetChatMessageResponse = ChatMessage;