'use client';

import { ChatUser } from '@/lib/api/chat/types';

interface TypingIndicatorProps {
  users: ChatUser[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names =
    users.length === 1
      ? users[0].display_name
      : users.length === 2
        ? `${users[0].display_name} and ${users[1].display_name}`
        : `${users[0].display_name} and ${users.length - 1} others`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
      </div>
      <span>{names} {users.length === 1 ? 'is' : 'are'} typing...</span>
    </div>
  );
}
