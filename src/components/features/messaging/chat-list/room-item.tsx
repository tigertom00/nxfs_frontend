'use client';

import { ChatRoom } from '@/lib/api/chat/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RoomItemProps {
  room: ChatRoom;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}

export default function RoomItem({
  room,
  isActive,
  unreadCount,
  onClick,
}: RoomItemProps) {
  // Get display name and avatar
  const displayName =
    room.room_type === 'direct' && room.other_user
      ? room.other_user.display_name
      : room.name || 'Unnamed Room';

  const avatarUrl =
    room.room_type === 'direct' && room.other_user
      ? room.other_user.clerk_profile_image_url || room.other_user.profile_picture
      : undefined;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format last message time
  const lastMessageTime = room.last_message
    ? formatDistanceToNow(new Date(room.last_message.timestamp), {
        addSuffix: false,
      })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted',
        isActive && 'bg-primary/10 border-l-4 border-primary'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary/20 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator - optional, can connect to presence system */}
        {/* <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" /> */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {lastMessageTime}
            </span>
          )}
        </div>

        {/* Last message preview */}
        {room.last_message && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {room.last_message.sender.display_name === 'You' ? 'You: ' : ''}
            {room.last_message.content}
          </p>
        )}

        {/* Room type badge (for groups/projects) */}
        {room.room_type !== 'direct' && (
          <Badge variant="outline" className="mt-1 text-xs">
            {room.room_type}
          </Badge>
        )}
      </div>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <Badge className="bg-primary text-primary-foreground flex-shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}
