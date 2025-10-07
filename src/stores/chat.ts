import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socketClient } from '@/lib/socket-client';
import { chatAPI } from '@/lib/api/chat';
import type {
  ChatRoom,
  Message,
  ChatUser,
  WSServerMessage,
  WSMessageEvent,
  WSTypingEvent,
} from '@/lib/api/chat/types';
import { toast } from 'sonner';

interface ChatState {
  // State
  rooms: Map<string, ChatRoom>;
  messages: Map<string, Message[]>;
  activeRoomId: string | null;
  typingUsers: Map<string, ChatUser[]>;
  unreadCounts: Map<string, number>;
  draftMessages: Map<string, string>;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  isConnected: boolean;

  // Actions - Rooms
  setActiveRoom: (roomId: string | null) => void;
  loadRooms: () => Promise<void>;
  loadRoom: (roomId: string) => Promise<void>;
  createDirectMessage: (userId: string) => Promise<ChatRoom | null>;
  createGroupRoom: (
    name: string,
    participantIds: string[]
  ) => Promise<ChatRoom | null>;
  leaveRoom: (roomId: string) => Promise<void>;
  markRoomAsRead: (roomId: string) => Promise<void>;

  // Actions - Messages
  loadMessages: (roomId: string, page?: number) => Promise<void>;
  sendMessage: (
    roomId: string,
    content: string,
    replyTo?: string
  ) => Promise<void>;
  sendMessageWithFile: (
    roomId: string,
    content: string,
    file: File,
    replyTo?: string
  ) => Promise<void>;
  editMessage: (
    roomId: string,
    messageId: string,
    content: string
  ) => Promise<void>;
  deleteMessage: (roomId: string, messageId: string) => Promise<void>;
  reactToMessage: (
    roomId: string,
    messageId: string,
    emoji: string
  ) => Promise<void>;

  // Actions - Real-time
  setTyping: (roomId: string, isTyping: boolean) => void;
  setDraftMessage: (roomId: string, content: string) => void;
  getDraftMessage: (roomId: string) => string;

  // Actions - Socket
  connectSocket: () => void;
  disconnectSocket: () => void;

  // Internal
  _handleSocketMessage: (data: WSServerMessage) => void;
  _addOptimisticMessage: (roomId: string, message: Message) => void;
  _removeOptimisticMessage: (roomId: string, tempId: string) => void;
  _updateMessage: (
    roomId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      rooms: new Map(),
      messages: new Map(),
      activeRoomId: null,
      typingUsers: new Map(),
      unreadCounts: new Map(),
      draftMessages: new Map(),
      isLoadingRooms: false,
      isLoadingMessages: false,
      isConnected: false,

      // Set active room
      setActiveRoom: (roomId) => {
        const { activeRoomId } = get();

        // Leave previous room
        if (activeRoomId && activeRoomId !== roomId) {
          socketClient.leaveRoom(activeRoomId);
        }

        // Join new room
        if (roomId) {
          socketClient.joinRoom(roomId);

          // Subscribe to room events
          const _unsubscribe = socketClient.onRoomEvent(roomId, (data) => {
            get()._handleSocketMessage(data);
          });

          // Clear typing users for this room
          set((state) => {
            const typingUsers = new Map(state.typingUsers);
            typingUsers.delete(roomId);
            return { typingUsers };
          });
        }

        set({ activeRoomId: roomId });
      },

      // Load rooms
      loadRooms: async () => {
        set({ isLoadingRooms: true });
        try {
          const response = await chatAPI.getChatRooms(1, 50);
          const roomsList = Array.isArray(response)
            ? response
            : response.results || [];

          const rooms = new Map<string, ChatRoom>();
          const unreadCounts = new Map<string, number>();

          roomsList.forEach((room) => {
            rooms.set(room.id, room);
            unreadCounts.set(room.id, room.unread_count || 0);
          });

          set({ rooms, unreadCounts, isLoadingRooms: false });
        } catch (error) {
          console.error('Failed to load rooms:', error);
          toast.error('Failed to load chat rooms');
          set({ isLoadingRooms: false });
        }
      },

      // Load specific room
      loadRoom: async (roomId) => {
        try {
          const room = await chatAPI.getChatRoom(roomId);

          set((state) => {
            const rooms = new Map(state.rooms);
            rooms.set(roomId, room);
            return { rooms };
          });
        } catch (error) {
          console.error('Failed to load room:', error);
          toast.error('Failed to load chat room');
        }
      },

      // Create direct message
      createDirectMessage: async (userId) => {
        try {
          const room = await chatAPI.createDirectMessage({ user_id: userId });

          set((state) => {
            const rooms = new Map(state.rooms);
            rooms.set(room.id, room);
            return { rooms };
          });

          return room;
        } catch (error) {
          console.error('Failed to create DM:', error);
          toast.error('Failed to create direct message');
          return null;
        }
      },

      // Create group room
      createGroupRoom: async (name, participantIds) => {
        try {
          const room = await chatAPI.createChatRoom({
            name,
            room_type: 'group',
            participant_ids: participantIds,
          });

          set((state) => {
            const rooms = new Map(state.rooms);
            rooms.set(room.id, room);
            return { rooms };
          });

          return room;
        } catch (error) {
          console.error('Failed to create group:', error);
          toast.error('Failed to create group chat');
          return null;
        }
      },

      // Leave room
      leaveRoom: async (roomId) => {
        try {
          await chatAPI.leaveRoom(roomId);

          set((state) => {
            const rooms = new Map(state.rooms);
            const messages = new Map(state.messages);
            const unreadCounts = new Map(state.unreadCounts);

            rooms.delete(roomId);
            messages.delete(roomId);
            unreadCounts.delete(roomId);

            const activeRoomId =
              state.activeRoomId === roomId ? null : state.activeRoomId;

            return { rooms, messages, unreadCounts, activeRoomId };
          });

          toast.success('Left chat room');
        } catch (error) {
          console.error('Failed to leave room:', error);
          toast.error('Failed to leave room');
        }
      },

      // Mark room as read
      markRoomAsRead: async (roomId) => {
        try {
          await chatAPI.markRoomAsRead(roomId);

          set((state) => {
            const unreadCounts = new Map(state.unreadCounts);
            unreadCounts.set(roomId, 0);
            return { unreadCounts };
          });
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      },

      // Load messages
      loadMessages: async (roomId, page = 1) => {
        set({ isLoadingMessages: true });
        try {
          const response = await chatAPI.getMessages(roomId, page, 50);
          const messagesList = Array.isArray(response)
            ? response
            : response.results || [];

          set((state) => {
            const messages = new Map(state.messages);
            const existing = messages.get(roomId) || [];

            // Prepend older messages (for infinite scroll)
            const combined =
              page > 1
                ? [...messagesList.reverse(), ...existing]
                : messagesList.reverse();

            messages.set(roomId, combined);
            return { messages, isLoadingMessages: false };
          });
        } catch (error) {
          console.error('Failed to load messages:', error);
          toast.error('Failed to load messages');
          set({ isLoadingMessages: false });
        }
      },

      // Send message
      sendMessage: async (roomId, content, replyTo) => {
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          room: roomId,
          sender: { id: 'temp', email: '', display_name: 'You' } as ChatUser,
          content,
          message_type: 'text',
          timestamp: new Date().toISOString(),
          is_deleted: false,
          reply_to: replyTo,
          reactions: {},
          read_by: [],
          is_edited: false,
        };

        // Optimistic update
        get()._addOptimisticMessage(roomId, tempMessage);

        try {
          const message = await chatAPI.sendMessage(roomId, {
            content,
            message_type: 'text',
            reply_to: replyTo,
          });

          // Replace temp with real message
          set((state) => {
            const messages = new Map(state.messages);
            const roomMessages = messages.get(roomId) || [];
            const filtered = roomMessages.filter((m) => m.id !== tempId);
            messages.set(roomId, [...filtered, message]);
            return { messages };
          });

          // Clear draft
          get().setDraftMessage(roomId, '');
        } catch (error) {
          console.error('Failed to send message:', error);
          toast.error('Failed to send message');
          get()._removeOptimisticMessage(roomId, tempId);
        }
      },

      // Send message with file
      sendMessageWithFile: async (roomId, content, file, replyTo) => {
        try {
          const message = await chatAPI.sendMessage(roomId, {
            content,
            message_type: 'file',
            file_attachment: file,
            reply_to: replyTo,
          });

          set((state) => {
            const messages = new Map(state.messages);
            const roomMessages = messages.get(roomId) || [];
            messages.set(roomId, [...roomMessages, message]);
            return { messages };
          });

          toast.success('File sent');
        } catch (error) {
          console.error('Failed to send file:', error);
          toast.error('Failed to send file');
        }
      },

      // Edit message
      editMessage: async (roomId, messageId, content) => {
        try {
          const updated = await chatAPI.updateMessage(roomId, messageId, {
            content,
          });

          get()._updateMessage(roomId, messageId, updated);
        } catch (error) {
          console.error('Failed to edit message:', error);
          toast.error('Failed to edit message');
        }
      },

      // Delete message
      deleteMessage: async (roomId, messageId) => {
        try {
          await chatAPI.deleteMessage(roomId, messageId);

          get()._updateMessage(roomId, messageId, { is_deleted: true });
          toast.success('Message deleted');
        } catch (error) {
          console.error('Failed to delete message:', error);
          toast.error('Failed to delete message');
        }
      },

      // React to message
      reactToMessage: async (roomId, messageId, emoji) => {
        try {
          const response = await chatAPI.reactToMessage(roomId, messageId, {
            emoji,
            action: 'add',
          });

          get()._updateMessage(roomId, messageId, {
            reactions: response.reactions,
          });
        } catch (error) {
          console.error('Failed to react:', error);
          toast.error('Failed to add reaction');
        }
      },

      // Set typing
      setTyping: (roomId, isTyping) => {
        socketClient.sendTyping(roomId, isTyping);
      },

      // Draft messages
      setDraftMessage: (roomId, content) => {
        set((state) => {
          const draftMessages = new Map(state.draftMessages);
          if (content) {
            draftMessages.set(roomId, content);
          } else {
            draftMessages.delete(roomId);
          }
          return { draftMessages };
        });
      },

      getDraftMessage: (roomId) => {
        return get().draftMessages.get(roomId) || '';
      },

      // Socket connection
      connectSocket: () => {
        socketClient.connect();
        set({ isConnected: true });
      },

      disconnectSocket: () => {
        socketClient.disconnect();
        set({ isConnected: false });
      },

      // Handle socket messages
      _handleSocketMessage: (data) => {
        switch (data.type) {
          case 'message': {
            const event = data as WSMessageEvent;
            const { message } = event;

            set((state) => {
              const messages = new Map(state.messages);
              const roomMessages = messages.get(message.room) || [];

              // Check if message already exists (avoid duplicates)
              const exists = roomMessages.some((m) => m.id === message.id);
              if (!exists) {
                messages.set(message.room, [...roomMessages, message]);
              }

              return { messages };
            });
            break;
          }

          case 'typing': {
            const event = data as WSTypingEvent;
            const roomId = get().activeRoomId;

            if (roomId) {
              set((state) => {
                const typingUsers = new Map(state.typingUsers);
                const users = typingUsers.get(roomId) || [];

                if (event.is_typing) {
                  // Add user
                  const userExists = users.some((u) => u.id === event.user_id);
                  if (!userExists) {
                    typingUsers.set(roomId, [
                      ...users,
                      {
                        id: event.user_id,
                        display_name: event.user,
                      } as ChatUser,
                    ]);
                  }
                } else {
                  // Remove user
                  typingUsers.set(
                    roomId,
                    users.filter((u) => u.id !== event.user_id)
                  );
                }

                return { typingUsers };
              });
            }
            break;
          }

          case 'user_joined':
          case 'user_left': {
            // Reload room to get updated participants
            const roomId = get().activeRoomId;
            if (roomId) {
              get().loadRoom(roomId);
            }
            break;
          }
        }
      },

      // Internal helpers
      _addOptimisticMessage: (roomId, message) => {
        set((state) => {
          const messages = new Map(state.messages);
          const roomMessages = messages.get(roomId) || [];
          messages.set(roomId, [...roomMessages, message]);
          return { messages };
        });
      },

      _removeOptimisticMessage: (roomId, tempId) => {
        set((state) => {
          const messages = new Map(state.messages);
          const roomMessages = messages.get(roomId) || [];
          messages.set(
            roomId,
            roomMessages.filter((m) => m.id !== tempId)
          );
          return { messages };
        });
      },

      _updateMessage: (roomId, messageId, updates) => {
        set((state) => {
          const messages = new Map(state.messages);
          const roomMessages = messages.get(roomId) || [];

          messages.set(
            roomId,
            roomMessages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            )
          );

          return { messages };
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        draftMessages: state.draftMessages,
      }),
    }
  )
);
