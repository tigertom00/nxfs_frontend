'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { chatbotAPI } from '@/lib/api';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Paperclip,
  Mic,
  Image as ImageIcon,
  File,
  Bot,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'file' | 'voice';
    name: string;
    url: string;
    file?: File;
  }>;
}

export default function ChatBot() {
  const { user, isAuthenticated } = useAuthStore();
  const { language, chatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const texts = {
    title: language === 'no' ? 'Chat med AI' : 'Chat with AI',
    placeholder:
      language === 'no' ? 'Skriv meldingen din...' : 'Type your message...',
    send: language === 'no' ? 'Send' : 'Send',
    typing: language === 'no' ? 'AI skriver...' : 'AI is typing...',
    error:
      language === 'no'
        ? 'Feil ved sending av melding'
        : 'Error sending message',
    retry: language === 'no' ? 'Prøv igjen' : 'Retry',
    newChat: language === 'no' ? 'Ny Chat' : 'New Chat',
    clearChat: language === 'no' ? 'Tøm Chat' : 'Clear Chat',
    attachment: language === 'no' ? 'Legg til vedlegg' : 'Add attachment',
    voiceMessage: language === 'no' ? 'Talemelding' : 'Voice message',
    image: language === 'no' ? 'Bilde' : 'Image',
    file: language === 'no' ? 'Fil' : 'File',
    chatWithAI: language === 'no' ? 'Chat med AI' : 'Chat with AI',
    online: language === 'no' ? 'Online' : 'Online',
    startConversation:
      language === 'no'
        ? 'Start en samtale med AI-assistenten'
        : 'Start a conversation with the AI assistant',
    fileSizeLimit: language === 'no' ? 'Fil for stor (maks 10MB)' : 'File too large (max 10MB)',
    fileTypeNotSupported: language === 'no' ? 'Filtype ikke støttet' : 'File type not supported',
    maxFiles: language === 'no' ? 'Maks 5 filer per melding' : 'Maximum 5 files per message',
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [chatOpen, isMinimized]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading || !isAuthenticated || !user) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? attachedFiles.map(file => ({
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        name: file.name,
        url: '',
        file
      })) : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);
    setError(null);

    try {
      // Use session_id from user data, fallback to user.id
      const sessionId = (user as any).session_id || user.id;

      const response = attachedFiles.length > 0
        ? await chatbotAPI.sendMessageWithFiles(sessionId, messageText, attachedFiles)
        : await chatbotAPI.sendMessage(sessionId, messageText);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.output || texts.error,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(texts.error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: texts.error,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setAttachedFiles([]);
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 5;

    if (files.length === 0) return;

    // Check total file limit
    if (attachedFiles.length + files.length > MAX_FILES) {
      setError(texts.maxFiles);
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: ${texts.fileSizeLimit}`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...validFiles]);
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleFileAttach = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '*/*';
      fileInputRef.current.click();
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!chatOpen) {
    return (
      <Button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300"
        size="lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 max-h-[calc(100vh-3rem)] ${
        isMinimized ? 'w-80' : 'w-[calc(100vw-3rem)] max-w-96 md:w-[440px]'
      }`}
    >
      <Card className="shadow-xl border-0 flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{texts.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {texts.online}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1 px-4 pb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="space-y-2">
                      <Bot className="h-12 w-12 text-primary mx-auto opacity-50" />
                      <p className="text-muted-foreground">
                        {texts.startConversation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.sender === 'ai' && (
                              <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.attachments.map(
                                      (attachment, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-1 text-xs opacity-80"
                                        >
                                          {attachment.type === 'image' && (
                                            <ImageIcon className="h-3 w-3" />
                                          )}
                                          {attachment.type === 'file' && (
                                            <File className="h-3 w-3" />
                                          )}
                                          {attachment.type === 'voice' && (
                                            <Mic className="h-3 w-3" />
                                          )}
                                          <span>{attachment.name}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              <p className="text-xs opacity-70 mt-1">
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                            {message.sender === 'user' && (
                              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-4 w-4" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {error && (
                      <Alert>
                        <AlertDescription className="flex items-center justify-between">
                          <span>{error}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendMessage}
                            className="ml-2"
                          >
                            {texts.retry}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-4">
                {/* Attached files preview */}
                {attachedFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 bg-muted rounded px-2 py-1 text-xs"
                      >
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <File className="h-3 w-3" />
                        )}
                        <span className="max-w-20 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeAttachedFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    title={texts.attachment}
                    onClick={handleFileAttach}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    title={texts.voiceMessage}
                    disabled={isLoading}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    title={texts.image}
                    onClick={handleImageUpload}
                    disabled={isLoading}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={texts.placeholder}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                    size="sm"
                    className="p-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChat}
                    className="text-xs"
                  >
                    {texts.clearChat}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {messages.length}{' '}
                    {messages.length === 1 ? 'message' : 'messages'}
                  </span>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
