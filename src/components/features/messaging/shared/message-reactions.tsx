'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MessageReactionsProps {
  reactions: Record<string, string[]>;
  currentUserId: string;
  onReact: (emoji: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageReactions({
  reactions,
  currentUserId,
  onReact,
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasReactions = Object.keys(reactions).length > 0;

  const userHasReacted = (emoji: string) => {
    return reactions[emoji]?.includes(currentUserId);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {hasReactions &&
        Object.entries(reactions).map(([emoji, userIds]) => (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs gap-1',
              userHasReacted(emoji) && 'bg-primary/20 border-primary'
            )}
            onClick={() => onReact(emoji)}
          >
            <span>{emoji}</span>
            <span className="text-muted-foreground">{userIds.length}</span>
          </Button>
        ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-xl hover:bg-primary/10"
                onClick={() => {
                  onReact(emoji);
                  setIsOpen(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
