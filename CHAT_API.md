# Chat Application API Documentation

## Overview

This is a real-time chat application built with Django Channels (WebSockets) and Django REST Framework. It supports direct messages, group chats, project-based discussions, and public channels with features like typing indicators, read receipts, message reactions, and threaded replies.

---

## Architecture

### WebSocket Communication
- **Django Channels**: Handles real-time WebSocket connections
- **Channel Layers**: Broadcasts messages to room participants
- **Async Consumers**: Two consumer types for different chat scenarios

### REST API
- **Django REST Framework**: Handles HTTP requests for CRUD operations
- **JWT Authentication**: All endpoints require authentication
- **Pagination**: 50 items per page (configurable up to 100)

---

## Data Models

### ChatRoom
Represents a conversation space between users.

**Fields:**
- `id` (UUID): Primary key
- `name` (string, optional): Room display name
- `room_type` (choice): `"direct"`, `"group"`, `"project"`, or `"public"`
- `participants` (M2M): Users in the room
- `created_by` (FK): User who created the room
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last activity timestamp
- `is_active` (boolean): Room status
- `direct_user1`, `direct_user2` (FK, optional): For direct message rooms only

**Room Types:**
- **direct**: One-on-one conversations
- **group**: Multi-user group chats
- **project**: Project-specific discussions
- **public**: Public channels anyone can join

### Message
Individual chat messages within a room.

**Fields:**
- `id` (UUID): Primary key
- `room` (FK): Associated chat room
- `sender` (FK): User who sent the message
- `content` (text): Message text content
- `message_type` (choice): `"text"`, `"image"`, `"file"`, `"system"`, or `"typing"`
- `file_attachment` (file, optional): Uploaded file
- `file_name` (string, optional): Original filename
- `file_size` (int, optional): File size in bytes
- `timestamp` (datetime): When message was sent
- `edited_at` (datetime, optional): Last edit timestamp
- `is_deleted` (boolean): Soft delete flag
- `reply_to` (FK, optional): Thread/reply support
- `reactions` (JSON): Emoji reactions `{"emoji": ["user_id1", "user_id2"]}`

### MessageReadStatus
Tracks which users have read which messages.

**Fields:**
- `message` (FK): The message
- `user` (FK): User who read it
- `read_at` (datetime): When it was read

**Unique together:** `(message, user)`

### TypingIndicator
Shows who is currently typing in a room.

**Fields:**
- `room` (FK): Chat room
- `user` (FK): User who is typing
- `is_typing` (boolean): Current typing status
- `last_seen` (datetime): Last activity timestamp

**Unique together:** `(room, user)`

---

## REST API Endpoints

### Base URL
All chat endpoints are prefixed with `/api/chat/`

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Chat Rooms

#### **List User's Chat Rooms**
```http
GET /api/chat/rooms/
```

**Response:**
```json
{
  "count": 10,
  "next": "http://api.example.com/api/chat/rooms/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-here",
      "name": "Project Alpha Discussion",
      "room_type": "project",
      "participants": [
        {
          "id": "uuid",
          "email": "user@example.com",
          "display_name": "John Doe",
          "profile_picture": "url",
          "clerk_profile_image_url": "url"
        }
      ],
      "created_by": { /* user object */ },
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-02T14:30:00Z",
      "is_active": true,
      "last_message": {
        "id": "uuid",
        "content": "Last message text",
        "sender": { /* user object */ },
        "timestamp": "2025-10-02T14:30:00Z"
      },
      "unread_count": 5,
      "other_user": null  // Only populated for direct messages
    }
  ]
}
```

#### **Create Chat Room**
```http
POST /api/chat/rooms/
```

**Request Body:**
```json
{
  "name": "Team Discussion",
  "room_type": "group",
  "participant_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** Same as room object above

#### **Get/Update/Delete Chat Room**
```http
GET    /api/chat/rooms/{room_id}/
PATCH  /api/chat/rooms/{room_id}/
DELETE /api/chat/rooms/{room_id}/
```

#### **Create or Get Direct Message Room**
```http
POST /api/chat/rooms/direct_message/
```

**Request Body:**
```json
{
  "user_id": "uuid-of-other-user"
}
```

**Response:** Returns existing DM room or creates a new one

**Note:** You cannot create a DM with yourself. The endpoint automatically finds existing DM rooms between two users regardless of who initiated it.

#### **Mark All Messages as Read**
```http
POST /api/chat/rooms/{room_id}/mark_read/
```

**Response:**
```json
{
  "status": "marked as read",
  "count": 12
}
```

#### **Get Typing Users**
```http
GET /api/chat/rooms/{room_id}/typing_users/
```

**Response:**
```json
[
  {
    "room": "room-uuid",
    "user": { /* user object */ },
    "is_typing": true,
    "last_seen": "2025-10-02T14:35:00Z"
  }
]
```

**Note:** Only returns users who have typed in the last 30 seconds.

#### **Leave Room**
```http
POST /api/chat/rooms/{room_id}/leave/
```

**Response:**
```json
{
  "status": "left room"
}
```

**Note:** Cannot leave direct message rooms.

---

### Messages

#### **List Messages in Room**
```http
GET /api/chat/rooms/{room_id}/messages/
```

**Query Parameters:**
- `page` (int): Page number
- `page_size` (int): Items per page (max 100)

**Response:**
```json
{
  "count": 250,
  "next": "url",
  "previous": "url",
  "results": [
    {
      "id": "uuid",
      "room": "room-uuid",
      "sender": {
        "id": "uuid",
        "email": "user@example.com",
        "display_name": "John Doe",
        "profile_picture": "url",
        "clerk_profile_image_url": "url"
      },
      "content": "Hello everyone!",
      "message_type": "text",
      "file_attachment": null,
      "file_name": null,
      "file_size": null,
      "timestamp": "2025-10-02T14:30:00Z",
      "edited_at": null,
      "is_deleted": false,
      "reply_to": null,
      "reactions": {
        "👍": ["user-id-1", "user-id-2"],
        "❤️": ["user-id-3"]
      },
      "read_by": [
        { /* user object */ }
      ],
      "is_edited": false
    }
  ]
}
```

#### **Send Message**
```http
POST /api/chat/rooms/{room_id}/messages/
```

**Request Body:**
```json
{
  "content": "Message text here",
  "message_type": "text",
  "reply_to": "message-uuid-optional",
  "file_attachment": null
}
```

**With File Upload:**
```http
Content-Type: multipart/form-data

content=Message text
message_type=file
file_attachment=<binary data>
```

**Response:** Returns the created message object

#### **Update Message**
```http
PATCH /api/chat/rooms/{room_id}/messages/{message_id}/
```

**Request Body:**
```json
{
  "content": "Updated message text"
}
```

**Note:** Only the message sender can update their own messages. Sets `edited_at` timestamp.

#### **Delete Message**
```http
DELETE /api/chat/rooms/{room_id}/messages/{message_id}/
```

**Response:** 204 No Content

**Note:** Soft delete - sets `is_deleted=true`. Only sender can delete their own messages.

#### **Add/Remove Reaction**
```http
POST /api/chat/rooms/{room_id}/messages/{message_id}/react/
```

**Request Body:**
```json
{
  "emoji": "👍",
  "action": "add"  // or "remove"
}
```

**Response:**
```json
{
  "reactions": {
    "👍": ["user-id-1", "user-id-2"]
  },
  "message": "Reaction added"
}
```

#### **Mark Message as Read**
```http
POST /api/chat/rooms/{room_id}/messages/{message_id}/mark_read/
```

**Response:**
```json
{
  "status": "marked as read",
  "was_already_read": false
}
```

---

### Search

#### **Search Messages**
```http
GET /api/chat/search/messages/?q=search+term
```

**Response:** Array of messages matching the search query (max 50 results)

#### **Search Rooms**
```http
GET /api/chat/search/rooms/?q=search+term
```

**Response:** Array of rooms matching name or participant details

---

### Chat Sessions

#### **Get Active Sessions**
```http
GET /api/chat/sessions/active_sessions/
```

**Response:**
```json
[
  {
    "session_id": "uuid",
    "session_type": "web",
    "is_active": true,
    "last_ping": "2025-10-02T14:35:00Z",
    "connected_at": "2025-10-02T14:00:00Z",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1"
  }
]
```

#### **Cleanup Old Sessions**
```http
POST /api/chat/sessions/cleanup_old_sessions/
```

**Response:**
```json
{
  "status": "cleanup completed",
  "deleted_sessions": 5
}
```

**Note:** Removes inactive sessions older than 24 hours.

---

## WebSocket API

### Connection Endpoints

#### **Chat Room WebSocket**
```
ws://your-domain/ws/chat/{room_id}/
```

Connect to a specific chat room by UUID.

#### **Direct Message WebSocket**
```
ws://your-domain/ws/direct/{user_id}/
```

Connect to a direct message conversation with a specific user. Creates the DM room automatically if it doesn't exist.

---

### Authentication

WebSocket connections use the same JWT authentication as REST endpoints. The token is validated when establishing the connection via Django Channels middleware.

---

### WebSocket Message Types

#### **1. Send Message**

**Client → Server:**
```json
{
  "type": "message",
  "content": "Hello everyone!",
  "reply_to": "message-uuid-optional"
}
```

**Server → All Clients in Room:**
```json
{
  "type": "message",
  "message": {
    "id": "uuid",
    "content": "Hello everyone!",
    "sender": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe"
    },
    "timestamp": "2025-10-02T14:30:00Z",
    "message_type": "text",
    "reply_to": null,
    "reactions": {}
  }
}
```

#### **2. Typing Indicator**

**Client → Server:**
```json
{
  "type": "typing",
  "is_typing": true
}
```

**Server → Other Clients in Room:**
```json
{
  "type": "typing",
  "user": "user@example.com",
  "user_id": "uuid",
  "is_typing": true
}
```

**Note:** Send `is_typing: false` when user stops typing. Typing indicators auto-expire after 30 seconds.

#### **3. Read Receipt**

**Client → Server:**
```json
{
  "type": "read_receipt",
  "message_id": "uuid"
}
```

**Note:** This marks the message as read in the database. No broadcast to other clients.

#### **4. User Joined (System Event)**

**Server → All Clients in Room:**
```json
{
  "type": "user_joined",
  "user": "user@example.com",
  "user_id": "uuid"
}
```

Sent automatically when a user connects to the WebSocket.

#### **5. User Left (System Event)**

**Server → All Clients in Room:**
```json
{
  "type": "user_left",
  "user": "user@example.com",
  "user_id": "uuid"
}
```

Sent automatically when a user disconnects from the WebSocket.

---

## WebSocket Connection Flow

### 1. **Establish Connection**
```javascript
const roomId = 'your-room-uuid';
const ws = new WebSocket(`ws://your-domain/ws/chat/${roomId}/`);

ws.onopen = (event) => {
  console.log('Connected to chat room');
};
```

### 2. **Handle Incoming Messages**
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'message':
      // New message received
      displayMessage(data.message);
      break;

    case 'typing':
      // User typing status changed
      updateTypingIndicator(data.user_id, data.is_typing);
      break;

    case 'user_joined':
      // User joined the room
      showNotification(`${data.user} joined`);
      break;

    case 'user_left':
      // User left the room
      showNotification(`${data.user} left`);
      break;
  }
};
```

### 3. **Send Messages**
```javascript
function sendMessage(content) {
  ws.send(JSON.stringify({
    type: 'message',
    content: content
  }));
}
```

### 4. **Send Typing Indicator**
```javascript
let typingTimeout;

function handleTyping() {
  // Send typing=true
  ws.send(JSON.stringify({
    type: 'typing',
    is_typing: true
  }));

  // Auto-cancel after 3 seconds of no typing
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing',
      is_typing: false
    }));
  }, 3000);
}
```

### 5. **Close Connection**
```javascript
ws.close();
```

---

## Integration Example (React/JavaScript)

### Basic Chat Component

```javascript
import { useState, useEffect, useRef } from 'react';

function ChatRoom({ roomId, authToken }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const ws = useRef(null);

  useEffect(() => {
    // Fetch initial messages via REST API
    fetch(`/api/chat/rooms/${roomId}/messages/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then(res => res.json())
      .then(data => setMessages(data.results));

    // Connect to WebSocket
    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'typing') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.user_id);
          } else {
            newSet.delete(data.user_id);
          }
          return newSet;
        });
      }
    };

    return () => ws.current?.close();
  }, [roomId, authToken]);

  const sendMessage = () => {
    if (inputValue.trim()) {
      ws.current.send(JSON.stringify({
        type: 'message',
        content: inputValue
      }));
      setInputValue('');
    }
  };

  const handleTyping = () => {
    ws.current.send(JSON.stringify({
      type: 'typing',
      is_typing: true
    }));
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.sender.display_name}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {typingUsers.size} user(s) typing...
        </div>
      )}

      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleTyping}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## Features Summary

### ✅ Implemented Features

1. **Multiple Room Types**: Direct messages, group chats, project rooms, public channels
2. **Real-time Messaging**: WebSocket-based instant message delivery
3. **Typing Indicators**: See when others are typing (30-second auto-expire)
4. **Read Receipts**: Track who has read each message
5. **Message Reactions**: Add emoji reactions to messages
6. **Threaded Replies**: Reply to specific messages
7. **Message Editing**: Edit sent messages (tracks `edited_at`)
8. **Soft Delete**: Delete messages without removing from database
9. **File Attachments**: Upload and share files in chat
10. **Search**: Search messages and rooms
11. **Pagination**: Efficient loading of message history
12. **Session Management**: Track active chat sessions per user
13. **Unread Counts**: Track unread messages per room
14. **User Presence**: User joined/left notifications

---

## Database Optimizations

- **Indexes** on frequently queried fields (room+timestamp, sender+timestamp, etc.)
- **Select/Prefetch Related** in querysets to minimize database hits
- **Bulk Operations** for marking messages as read
- **Soft Deletes** instead of hard deletes for message history

---

## Security Considerations

1. **Authentication Required**: All endpoints require JWT authentication
2. **Permission Checks**: Users can only access rooms they're participants of
3. **Message Ownership**: Only senders can edit/delete their own messages
4. **Room Access Control**: Verified on both REST and WebSocket connections
5. **Input Validation**: Content validation on message creation

---

## File Locations

- **Models**: `/app/chat/models.py`
- **Views**: `/app/chat/views.py`
- **Serializers**: `/app/chat/serializers.py`
- **WebSocket Consumers**: `/app/chat/consumers.py`
- **URL Routing**: `/app/chat/urls.py`
- **WebSocket Routing**: `/srv/routing.py`

---

## Error Handling

### Common HTTP Error Responses

**400 Bad Request**
```json
{
  "error": "Search query is required"
}
```

**403 Forbidden**
```json
{
  "detail": "You don't have access to this room"
}
```

**404 Not Found**
```json
{
  "detail": "User not found"
}
```

---

## Next Steps / TODO

- [ ] Add message encryption (end-to-end)
- [ ] Implement voice/video call support
- [ ] Add message search with filters (date range, sender, etc.)
- [ ] Implement message pinning
- [ ] Add user blocking/muting
- [ ] Implement room-level permissions
- [ ] Add notification preferences per room
- [ ] Create webhook support for external integrations

---

## Support

For questions or issues, contact the backend team or refer to the main project documentation in `CLAUDE.md`.
