'use client';

import { ChatRoom } from '@/lib/api/chat/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  room: ChatRoom;
  onBack?: () => void;
  onShowInfo?: () => void;
}

export default function ChatHeader({ room, onBack, onShowInfo }: ChatHeaderProps) {
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

  const participantCount = room.participants?.length || 0;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
      {/* Back button (mobile) */}
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className="bg-primary/20 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Room info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-foreground truncate">{displayName}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {room.room_type !== 'direct' && (
            <>
              <Users className="h-3 w-3" />
              <span>{participantCount} members</span>
            </>
          )}
          {room.room_type === 'direct' && (
            <span className="text-xs">Online</span> // Can connect to presence system
          )}
        </div>
      </div>

      {/* Room type badge */}
      {room.room_type !== 'direct' && (
        <Badge variant="outline" className="capitalize">
          {room.room_type}
        </Badge>
      )}

      {/* Actions */}
      <Button variant="ghost" size="icon" onClick={onShowInfo}>
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
}
