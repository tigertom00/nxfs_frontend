'use client';

import { Message, ChatUser } from '@/lib/api/chat/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import TextMessage from '../message-types/text-message';
import FileMessage from '../message-types/file-message';
import MessageReactions from '../shared/message-reactions';
import { Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentUser: ChatUser;
  isOwn: boolean;
  showAvatar: boolean; // Show avatar if first message in a sequence
  onReact: (messageId: string, emoji: string) => void;
}

export default function MessageItem({
  message,
  currentUser,
  isOwn,
  showAvatar,
  onReact,
}: MessageItemProps) {
  const initials = message.sender.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl =
    message.sender.clerk_profile_image_url || message.sender.profile_picture;

  const isRead = message.read_by && message.read_by.length > 0;

  if (message.is_deleted) {
    return (
      <div className={cn('flex gap-2 px-4 py-1', isOwn && 'justify-end')}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
          <span>Message deleted</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2 px-4 py-1 group hover:bg-muted/50 transition-colors',
        isOwn && 'justify-end'
      )}
    >
      {/* Avatar (left side for others) */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={message.sender.display_name} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isOwn && 'items-end'
        )}
      >
        {/* Sender name (only for others and first message in sequence) */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-foreground px-3">
            {message.sender.display_name}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {message.message_type === 'file' || message.message_type === 'image' ? (
            <FileMessage message={message} />
          ) : (
            <TextMessage message={message} />
          )}

          {/* Edited indicator */}
          {message.is_edited && (
            <span className="text-xs opacity-70 ml-2">(edited)</span>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(message.reactions || {}).length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            currentUserId={currentUser.id}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        )}

        {/* Timestamp and read status */}
        <div className="flex items-center gap-1 px-3">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
            })}
          </span>

          {/* Read receipts (only for own messages) */}
          {isOwn && (
            <span className="text-muted-foreground">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Avatar placeholder (right side for own messages) */}
      {isOwn && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
