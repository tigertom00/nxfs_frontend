import { io, Socket } from 'socket.io-client';
import type {
  WSClientMessage,
  WSServerMessage,
  Message,
  ChatUser,
} from './api/chat/types';

type RoomEventHandler = (data: WSServerMessage) => void;

class SocketClient {
  private socket: Socket | null = null;
  private roomHandlers: Map<string, Set<RoomEventHandler>> = new Map();
  private currentRoom: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize Socket.IO connection
   */
  connect(url?: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Connect to Django backend Socket.IO server
    const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.nxfs.no';

    this.socket = io(socketUrl, {
      path: '/api/socketio/',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) {return;}

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Rejoin current room if reconnecting
      if (this.currentRoom) {
        this.joinRoom(this.currentRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Chat-specific events
    this.socket.on('message:new', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('message:updated', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('message:deleted', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('message:reaction', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('typing:update', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('user:joined', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('user:left', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });

    this.socket.on('presence:change', (data: WSServerMessage) => {
      this.notifyRoomHandlers(data);
    });
  }

  /**
   * Notify all handlers for the current room
   */
  private notifyRoomHandlers(data: WSServerMessage): void {
    if (!this.currentRoom) {return;}

    const handlers = this.roomHandlers.get(this.currentRoom);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }

    // Leave current room if any
    if (this.currentRoom && this.currentRoom !== roomId) {
      this.leaveRoom(this.currentRoom);
    }

    this.socket.emit('room:join', { room_id: roomId });
    this.currentRoom = roomId;
    console.log(`📥 Joined room: ${roomId}`);
  }

  /**
   * Leave a chat room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {return;}

    this.socket.emit('room:leave', { room_id: roomId });

    if (this.currentRoom === roomId) {
      this.currentRoom = null;
    }

    console.log(`📤 Left room: ${roomId}`);
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(roomId: string, content: string, replyTo?: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    const payload: WSClientMessage = {
      type: 'message',
      content,
      reply_to: replyTo,
    };

    this.socket.emit('message:send', {
      room_id: roomId,
      ...payload,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {return;}

    const payload: WSClientMessage = {
      type: 'typing',
      is_typing: isTyping,
    };

    this.socket.emit('typing:status', {
      room_id: roomId,
      ...payload,
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(roomId: string, messageId: string): void {
    if (!this.socket?.connected) {return;}

    const payload: WSClientMessage = {
      type: 'read_receipt',
      message_id: messageId,
    };

    this.socket.emit('read:receipt', {
      room_id: roomId,
      ...payload,
    });
  }

  /**
   * Subscribe to room events
   */
  onRoomEvent(roomId: string, handler: RoomEventHandler): () => void {
    if (!this.roomHandlers.has(roomId)) {
      this.roomHandlers.set(roomId, new Set());
    }

    this.roomHandlers.get(roomId)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.roomHandlers.get(roomId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.roomHandlers.delete(roomId);
        }
      }
    };
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
      this.roomHandlers.clear();
      console.log('🔌 Socket.IO disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current room
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }
}

// Singleton instance
export const socketClient = new SocketClient();

// Auto-connect on import (optional - can be called manually instead)
// socketClient.connect();
