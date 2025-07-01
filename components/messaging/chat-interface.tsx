
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  ImageIcon,
  FileIcon,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content?: string;
  messageType: 'TEXT' | 'MEDIA' | 'SYSTEM' | 'EMERGENCY';
  senderId: string;
  senderName: string;
  sentAt: Date;
  mediaUrl?: string;
  mediaType?: string;
  readByUser: boolean;
}

interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'COMMUNITY';
  title?: string;
  participantCount: number;
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderName: string;
  };
  unreadCount: number;
  isActive: boolean;
}

interface ChatInterfaceProps {
  currentUserId: string;
  currentUserName: string;
  selectedChat: Chat | null;
  messages: Message[];
  onSendMessage: (content: string, messageType?: string) => void;
  onBackToChats: () => void;
  isLoading?: boolean;
}

export default function ChatInterface({
  currentUserId,
  currentUserName,
  selectedChat,
  messages,
  onSendMessage,
  onBackToChats,
  isLoading = false,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      onSendMessage(messageInput.trim(), 'TEXT');
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTime = (sentAt: Date) => {
    const now = new Date();
    const messageDate = new Date(sentAt);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === currentUserId;
    const isSystemMessage = message.messageType === 'SYSTEM';
    const isEmergencyMessage = message.messageType === 'EMERGENCY';

    if (isSystemMessage) {
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center my-4"
        >
          <Badge variant="secondary" className="text-xs py-1 px-3">
            {message.content}
          </Badge>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="text-xs">
              {message.senderName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <span className="text-xs text-muted-foreground mb-1">{message.senderName}</span>
          )}
          
          <div
            className={`rounded-lg px-3 py-2 ${
              isOwnMessage
                ? 'bg-blue-500 text-white'
                : isEmergencyMessage
                ? 'bg-red-500 text-white'
                : 'bg-muted'
            } ${isEmergencyMessage ? 'border-2 border-red-600' : ''}`}
          >
            {message.mediaUrl ? (
              <div className="space-y-2">
                {message.mediaType?.startsWith('image/') ? (
                  <div className="relative">
                    <img
                      src={message.mediaUrl}
                      alt="Shared media"
                      className="rounded max-w-64 max-h-48 object-cover"
                    />
                    <ImageIcon className="absolute top-2 right-2 w-4 h-4 text-white bg-black/50 rounded p-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                    <FileIcon className="w-4 h-4" />
                    <span className="text-sm">Media file</span>
                  </div>
                )}
                {message.content && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">
              {getMessageTime(message.sentAt)}
            </span>
            {isOwnMessage && (
              <Badge
                variant={message.readByUser ? "default" : "secondary"}
                className="text-xs h-4 px-1"
              >
                {message.readByUser ? 'Read' : 'Sent'}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToChats}
              className="md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {selectedChat.type === 'DIRECT' ? 'DC' : selectedChat.type === 'GROUP' ? 'GC' : 'CC'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold">
                  {selectedChat.title || 'Chat'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedChat.type === 'DIRECT' 
                    ? 'Direct message'
                    : `${selectedChat.participantCount} members`
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => renderMessage(message, index))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm" className="shrink-0">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-20"
              disabled={isLoading}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isLoading}
            size="sm"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground mt-2"
          >
            Someone is typing...
          </motion.div>
        )}
      </div>
    </div>
  );
}
