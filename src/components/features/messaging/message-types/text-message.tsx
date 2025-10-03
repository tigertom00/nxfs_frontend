'use client';

import { Message } from '@/lib/api/chat/types';

interface TextMessageProps {
  message: Message;
}

export default function TextMessage({ message }: TextMessageProps) {
  return (
    <div className="text-sm text-foreground whitespace-pre-wrap break-words">
      {message.content}
    </div>
  );
}
