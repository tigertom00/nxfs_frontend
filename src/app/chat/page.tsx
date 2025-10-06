'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useChatStore } from '@/stores';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import ChatList from '@/components/features/messaging/chat-list/chat-list';
import ChatHeader from '@/components/features/messaging/chat-room/chat-header';
import MessageList from '@/components/features/messaging/chat-room/message-list';
import MessageInput from '@/components/features/messaging/chat-room/message-input';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    rooms,
    messages,
    activeRoomId,
    typingUsers,
    isLoadingMessages,
    connectSocket,
    disconnectSocket,
    loadMessages,
    sendMessage,
    sendMessageWithFile,
    reactToMessage,
    setTyping,
    getDraftMessage,
    setDraftMessage,
    markRoomAsRead,
  } = useChatStore();

  // Authentication check
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Connect socket on mount
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, connectSocket, disconnectSocket]);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      loadMessages(activeRoomId);
      markRoomAsRead(activeRoomId);
      setIsMobileSidebarOpen(false); // Close sidebar on mobile when room selected
    }
  }, [activeRoomId, loadMessages, markRoomAsRead]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  const activeRoom = activeRoomId ? rooms.get(activeRoomId) : null;
  const roomMessages = activeRoomId ? messages.get(activeRoomId) || [] : [];
  const roomTypingUsers = activeRoomId ? typingUsers.get(activeRoomId) || [] : [];
  const draftMessage = activeRoomId ? getDraftMessage(activeRoomId) : '';

  const handleSendMessage = (content: string, file?: File) => {
    if (!activeRoomId) {return;}

    if (file) {
      sendMessageWithFile(activeRoomId, content, file);
    } else {
      sendMessage(activeRoomId, content);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeRoomId) {return;}
    setTyping(activeRoomId, isTyping);
  };

  const handleDraftChange = (value: string) => {
    if (!activeRoomId) {return;}
    setDraftMessage(activeRoomId, value);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!activeRoomId) {return;}
    reactToMessage(activeRoomId, messageId, emoji);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="h-[calc(100vh-4rem)]">
        {/* Two-column layout */}
        <div className="flex h-full">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-20 left-4 z-50 bg-card shadow-lg"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Chat list sidebar */}
          <AnimatePresence>
            {(isMobileSidebarOpen || window.innerWidth >= 768) && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'w-full md:w-80 lg:w-96 border-r border-border',
                  'md:relative absolute inset-y-0 left-0 z-40 bg-card'
                )}
              >
                <ChatList />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat room area */}
          <div className="flex-1 flex flex-col bg-background">
            {activeRoom ? (
              <>
                {/* Chat header */}
                <ChatHeader
                  room={activeRoom}
                  onBack={() => setIsMobileSidebarOpen(true)}
                />

                {/* Message list */}
                <div className="flex-1 overflow-hidden">
                  <MessageList
                    messages={roomMessages}
                    currentUser={{
                      id: user.id,
                      email: user.email,
                      display_name: user.display_name || user.email,
                      clerk_profile_image_url: user.clerk_profile_image_url,
                    }}
                    typingUsers={roomTypingUsers}
                    isLoading={isLoadingMessages}
                    onReact={handleReaction}
                  />
                </div>

                {/* Message input */}
                {activeRoomId && (
                  <MessageInput
                    roomId={activeRoomId}
                    value={draftMessage}
                    onChange={handleDraftChange}
                    onSend={handleSendMessage}
                    onTyping={handleTyping}
                  />
                )}
              </>
            ) : (
              /* Empty state - no room selected */
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Welcome to Messages
                  </h2>
                  <p className="text-muted-foreground">
                    Select a conversation or start a new chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatBot />
    </div>
  );
}
