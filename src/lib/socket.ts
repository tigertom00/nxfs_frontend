import { Server, Socket } from 'socket.io';

interface SocketData {
  userId?: string;
  roomId?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id);
    const socketData = socket.data as SocketData;

    // Room management
    socket.on('room:join', ({ room_id, user_id }: { room_id: string; user_id?: string }) => {
      // Leave previous room if any
      if (socketData.roomId) {
        socket.leave(socketData.roomId);
        io.to(socketData.roomId).emit('user:left', {
          type: 'user_left',
          user: user_id || 'Unknown',
          user_id: user_id || socket.id,
        });
      }

      // Join new room
      socket.join(room_id);
      socketData.roomId = room_id;
      socketData.userId = user_id;

      console.log(`📥 Socket ${socket.id} joined room: ${room_id}`);

      // Notify others in room
      socket.to(room_id).emit('user:joined', {
        type: 'user_joined',
        user: user_id || 'Unknown',
        user_id: user_id || socket.id,
      });
    });

    socket.on('room:leave', ({ room_id }: { room_id: string }) => {
      socket.leave(room_id);

      if (socketData.roomId === room_id) {
        socketData.roomId = undefined;
      }

      console.log(`📤 Socket ${socket.id} left room: ${room_id}`);

      // Notify others
      io.to(room_id).emit('user:left', {
        type: 'user_left',
        user: socketData.userId || 'Unknown',
        user_id: socketData.userId || socket.id,
      });
    });

    // Message handling (Note: Actual message sending should go through REST API)
    socket.on('message:send', (data: { room_id: string; content: string; reply_to?: string }) => {
      const { room_id, content, reply_to } = data;

      // Broadcast to room (this is a fallback - main messages go through REST API)
      socket.to(room_id).emit('message:new', {
        type: 'message',
        message: {
          id: `temp-${Date.now()}`,
          room: room_id,
          content,
          sender: { id: socketData.userId, display_name: socketData.userId },
          message_type: 'text',
          timestamp: new Date().toISOString(),
          reply_to,
          reactions: {},
          read_by: [],
          is_edited: false,
          is_deleted: false,
        },
      });
    });

    // Typing indicators
    socket.on('typing:status', ({ room_id, is_typing }: { room_id: string; is_typing: boolean }) => {
      socket.to(room_id).emit('typing:update', {
        type: 'typing',
        user: socketData.userId || 'Unknown',
        user_id: socketData.userId || socket.id,
        is_typing,
      });
    });

    // Read receipts
    socket.on('read:receipt', ({ room_id, message_id }: { room_id: string; message_id: string }) => {
      socket.to(room_id).emit('message:read', {
        type: 'read_receipt',
        message_id,
        user_id: socketData.userId || socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);

      // Notify room members if user was in a room
      if (socketData.roomId) {
        io.to(socketData.roomId).emit('user:left', {
          type: 'user_left',
          user: socketData.userId || 'Unknown',
          user_id: socketData.userId || socket.id,
        });
      }
    });

    // Legacy echo support (for backward compatibility)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });
  });
};
