
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import {
  Search,
  Plus,
  MessageSquare,
  Users,
  Globe,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

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

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export default function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  isLoading = false,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'community'>('all');

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || chat.type.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'DIRECT':
        return <MessageCircle className="w-4 h-4" />;
      case 'GROUP':
        return <Users className="w-4 h-4" />;
      case 'COMMUNITY':
        return <Globe className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.title) return chat.title;
    switch (chat.type) {
      case 'DIRECT':
        return 'Direct Chat';
      case 'GROUP':
        return 'Group Chat';
      case 'COMMUNITY':
        return 'Community Chat';
      default:
        return 'Chat';
    }
  };

  const renderChatItem = (chat: Chat, index: number) => (
    <motion.div
      key={chat.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
          selectedChatId === chat.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => onSelectChat(chat)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {getChatIcon(chat.type)}
                </AvatarFallback>
              </Avatar>
              
              {chat.unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {getChatTitle(chat)}
                </h3>
                
                {chat.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(chat.lastMessage.sentAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {chat.type.toLowerCase()}
                </Badge>
                
                {chat.type !== 'DIRECT' && (
                  <span className="text-xs text-muted-foreground">
                    {chat.participantCount} members
                  </span>
                )}
              </div>
              
              {chat.lastMessage ? (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{chat.lastMessage.senderName}: </span>
                  <span className="truncate">
                    {chat.lastMessage.content}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No messages yet
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button onClick={onNewChat} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: MessageSquare },
            { key: 'direct', label: 'Direct', icon: MessageCircle },
            { key: 'group', label: 'Groups', icon: Users },
            { key: 'community', label: 'Community', icon: Globe },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="flex items-center gap-1"
            >
              <Icon className="w-3 h-3" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div>
            {filteredChats.map((chat, index) => renderChatItem(chat, index))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No conversations found</p>
            <p className="text-sm text-center">
              {searchQuery ? 'Try adjusting your search terms' : 'Start a new conversation to get started'}
            </p>
            <Button onClick={onNewChat} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        )}
      </ScrollArea>
      
      {/* Quick Stats */}
      <div className="border-t p-4 bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{chats.length} conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)} unread
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
