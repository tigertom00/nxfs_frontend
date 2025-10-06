'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Message, ChatUser } from '@/lib/api/chat/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem from './message-item';
import TypingIndicator from './typing-indicator';
import { Loader2 } from 'lucide-react';
import { formatDate, isSameDay } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUser: ChatUser;
  typingUsers: ChatUser[];
  isLoading: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

export default function MessageList({
  messages,
  currentUser,
  typingUsers,
  isLoading,
  onReact,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Group messages by date and determine if avatar should be shown
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      date: string;
      messages: Array<{
        message: Message;
        showAvatar: boolean;
      }>;
    }> = [];

    let currentDate = '';
    let lastSenderId = '';

    messages.forEach((message, index) => {
      const messageDate = formatDate(new Date(message.timestamp), 'yyyy-MM-dd');

      // Create new date group if date changed
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: messageDate,
          messages: [],
        });
      }

      // Determine if we should show avatar
      // Show avatar if:
      // 1. First message in date group
      // 2. Different sender than previous message
      // 3. More than 5 minutes gap between messages
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showAvatar =
        !prevMessage ||
        prevMessage.sender.id !== message.sender.id ||
        new Date(message.timestamp).getTime() -
          new Date(prevMessage.timestamp).getTime() >
          5 * 60 * 1000;

      lastSenderId = message.sender.id;

      // Add to current date group
      groups[groups.length - 1].messages.push({
        message,
        showAvatar,
      });
    });

    return groups;
  }, [messages]);

  // Format date divider
  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {return 'Today';}
    if (isSameDay(date, yesterday)) {return 'Yesterday';}
    return formatDate(date, 'MMMM d, yyyy');
  };

  return (
    <ScrollArea className="flex-1 h-full">
      <div ref={scrollRef} className="flex flex-col py-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                    {formatDateDivider(group.date)}
                  </div>
                </div>

                {/* Messages for this date */}
                {group.messages.map(({ message, showAvatar }) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    isOwn={message.sender.id === currentUser.id}
                    showAvatar={showAvatar}
                    onReact={onReact}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
