'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import RoomItem from './room-item';
import RoomSearch from './room-search';
import { useIntl } from '@/hooks/use-intl';

interface ChatListProps {
  onNewChat?: () => void;
}

export default function ChatList({ onNewChat }: ChatListProps) {
  const { t } = useIntl();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    rooms,
    activeRoomId,
    unreadCounts,
    isLoadingRooms,
    setActiveRoom,
    loadRooms,
  } = useChatStore();

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Convert rooms Map to array and sort by last message
  const roomsArray = useMemo(() => {
    return Array.from(rooms.values()).sort((a, b) => {
      const aTime = a.last_message?.timestamp || a.updated_at;
      const bTime = b.last_message?.timestamp || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [rooms]);

  // Filter rooms by search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return roomsArray;

    const query = searchQuery.toLowerCase();
    return roomsArray.filter((room) => {
      const displayName =
        room.room_type === 'direct' && room.other_user
          ? room.other_user.display_name
          : room.name || '';

      return (
        displayName.toLowerCase().includes(query) ||
        room.last_message?.content.toLowerCase().includes(query)
      );
    });
  }, [roomsArray, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="hover-lift"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
        <RoomSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Room list */}
      <ScrollArea className="flex-1">
        {isLoadingRooms ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onNewChat}
              >
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                unreadCount={unreadCounts.get(room.id) || 0}
                onClick={() => setActiveRoom(room.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
