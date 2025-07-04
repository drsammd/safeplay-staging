// @ts-nocheck

import { prisma } from '../db';
import { ChatType, MessageType, MessageStatus } from '@prisma/client';

export interface CreateChatOptions {
  type: ChatType;
  title?: string;
  description?: string;
  venueId?: string;
  groupId?: string;
  participantIds: string[];
  creatorId: string;
}

export interface SendMessageOptions {
  chatId: string;
  senderId: string;
  content?: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaType?: string;
  replyToId?: string;
  metadata?: any;
}

export interface ChatInfo {
  id: string;
  type: ChatType;
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

export class MessagingInfrastructureService {
  /**
   * Create a new chat
   */
  async createChat(options: CreateChatOptions): Promise<{
    success: boolean;
    chatId?: string;
    error?: string;
  }> {
    try {
      const { type, title, description, venueId, groupId, participantIds, creatorId } = options;

      // Validate participants
      if (participantIds.length < 1) {
        return {
          success: false,
          error: 'At least one participant is required',
        };
      }

      // For direct chats, ensure only 2 participants
      if (type === ChatType.DIRECT && participantIds.length !== 2) {
        return {
          success: false,
          error: 'Direct chats must have exactly 2 participants',
        };
      }

      // Check if direct chat already exists
      if (type === ChatType.DIRECT) {
        const existingChat = await this.findExistingDirectChat(participantIds);
        if (existingChat) {
          return {
            success: true,
            chatId: existingChat.id,
          };
        }
      }

      // Create chat
      const chat = await prisma.chat.create({
        data: {
          type,
          title,
          description,
          venueId,
          groupId,
          participantCount: participantIds.length,
        },
      });

      // Add participants
      await Promise.all(
        participantIds.map(userId =>
          prisma.chatParticipant.create({
            data: {
              chatId: chat.id,
              userId,
              role: userId === creatorId ? 'admin' : 'member',
            },
          })
        )
      );

      // Send system message for group chats
      if (type !== ChatType.DIRECT) {
        await this.sendMessage({
          chatId: chat.id,
          senderId: creatorId,
          content: `Chat created: ${title || 'New conversation'}`,
          messageType: MessageType.SYSTEM,
        });
      }

      return {
        success: true,
        chatId: chat.id,
      };
    } catch (error: any) {
      console.error('Error creating chat:', error);
      return {
        success: false,
        error: error.message || 'Failed to create chat',
      };
    }
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(options: SendMessageOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { chatId, senderId, content, messageType, mediaUrl, mediaType, replyToId, metadata } = options;

      // Verify sender is participant in chat
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId: senderId,
          },
        },
      });

      if (!participant) {
        return {
          success: false,
          error: 'Sender is not a participant in this chat',
        };
      }

      if (participant.leftAt) {
        return {
          success: false,
          error: 'Sender has left this chat',
        };
      }

      // Validate message content
      if (!content && !mediaUrl) {
        return {
          success: false,
          error: 'Message must have content or media',
        };
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId,
          content,
          messageType,
          status: MessageStatus.SENT,
          mediaUrl,
          mediaType: mediaType as any,
          replyToId,
          metadata,
        },
      });

      // Update chat last message timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: new Date(),
        },
      });

      // Create message deliveries for all other participants
      const otherParticipants = await prisma.chatParticipant.findMany({
        where: {
          chatId,
          userId: { not: senderId },
          leftAt: null,
        },
      });

      await Promise.all(
        otherParticipants.map(participant =>
          prisma.messageDelivery.create({
            data: {
              messageId: message.id,
              recipientId: participant.userId,
              status: MessageStatus.SENT,
            },
          })
        )
      );

      // Send real-time notifications (this would integrate with WebSocket service)
      await this.sendMessageNotifications(message.id, otherParticipants.map(p => p.userId));

      return {
        success: true,
        messageId: message.id,
      };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  /**
   * Get chat messages with pagination
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    success: boolean;
    messages?: Array<{
      id: string;
      content?: string;
      messageType: MessageType;
      senderId: string;
      senderName: string;
      sentAt: Date;
      isEdited: boolean;
      mediaUrl?: string;
      mediaType?: string;
      replyTo?: {
        id: string;
        content?: string;
        senderName: string;
      };
      readByUser: boolean;
    }>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    error?: string;
  }> {
    try {
      // Verify user is participant
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
      });

      if (!participant) {
        return {
          success: false,
          error: 'User is not a participant in this chat',
        };
      }

      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.message.count({
        where: {
          chatId,
          isDeleted: false,
        },
      });

      // Get messages
      const messages = await prisma.message.findMany({
        where: {
          chatId,
          isDeleted: false,
        },
        include: {
          sender: true,
          replyTo: {
            include: {
              sender: true,
            },
          },
          deliveries: {
            where: {
              recipientId: userId,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      });

      // Mark messages as delivered
      await this.markMessagesAsDelivered(
        messages.map(m => m.id),
        userId
      );

      const formattedMessages = messages.map(message => ({
        id: message.id,
        content: message.content || undefined,
        messageType: message.messageType,
        senderId: message.senderId,
        senderName: message.sender.name,
        sentAt: new Date(message.sentAt),
        isEdited: message.isEdited,
        mediaUrl: message.mediaUrl || undefined,
        mediaType: message.mediaType || undefined,
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content || undefined,
          senderName: message.replyTo.sender.name,
        } : undefined,
        readByUser: message.deliveries[0]?.readAt !== null,
      }));

      return {
        success: true,
        messages: formattedMessages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      };
    } catch (error: any) {
      console.error('Error getting chat messages:', error);
      return {
        success: false,
        error: error.message || 'Failed to get chat messages',
      };
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string): Promise<{
    success: boolean;
    chats?: ChatInfo[];
    error?: string;
  }> {
    try {
      const participations = await prisma.chatParticipant.findMany({
        where: {
          userId,
          leftAt: null,
        },
        include: {
          chat: {
            include: {
              messages: {
                include: {
                  sender: true,
                },
                orderBy: {
                  sentAt: 'desc',
                },
                take: 1,
              },
              participants: {
                where: {
                  leftAt: null,
                },
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          chat: {
            lastMessageAt: 'desc',
          },
        },
      });

      const chats: ChatInfo[] = [];

      for (const participation of participations) {
        const chat = participation.chat;
        
        // Get unread count
        const unreadCount = await prisma.messageDelivery.count({
          where: {
            recipientId: userId,
            readAt: null,
            message: {
              chatId: chat.id,
              senderId: { not: userId },
            },
          },
        });

        // Generate title for direct chats
        let title = chat.title ?? undefined;
        if (chat.type === ChatType.DIRECT && !title) {
          const otherParticipant = chat.participants.find(p => p.userId !== userId);
          title = otherParticipant?.user.name || 'Direct Chat';
        }

        chats.push({
          id: chat.id,
          type: chat.type as ChatType,
          title,
          participantCount: chat.participantCount,
          lastMessage: chat.messages[0] ? {
            content: chat.messages[0].content ?? '[Media]',
            sentAt: new Date(chat.messages[0].sentAt),
            senderName: chat.messages[0].sender.name,
          } : undefined,
          unreadCount,
          isActive: chat.isActive,
        });
      }

      return {
        success: true,
        chats,
      };
    } catch (error: any) {
      console.error('Error getting user chats:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user chats',
      };
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    messageIds: string[],
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await prisma.messageDelivery.updateMany({
        where: {
          messageId: { in: messageIds },
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: MessageStatus.READ,
        },
      });

      // Update participant last read time
      const chatIds = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { chatId: true },
        distinct: ['chatId'],
      });

      await Promise.all(
        chatIds.map(({ chatId }) =>
          prisma.chatParticipant.updateMany({
            where: {
              chatId,
              userId,
            },
            data: {
              lastReadAt: new Date(),
            },
          })
        )
      );

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark messages as read',
      };
    }
  }

  /**
   * Add participants to group chat
   */
  async addParticipants(
    chatId: string,
    participantIds: string[],
    addedBy: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify requester is admin or moderator
      const requester = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId: addedBy,
          },
        },
      });

      if (!requester || !['admin', 'moderator'].includes(requester.role)) {
        return {
          success: false,
          error: 'Insufficient permissions to add participants',
        };
      }

      // Check chat type
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        return {
          success: false,
          error: 'Chat not found',
        };
      }

      if (chat.type === ChatType.DIRECT) {
        return {
          success: false,
          error: 'Cannot add participants to direct chat',
        };
      }

      // Add new participants
      await Promise.all(
        participantIds.map(userId =>
          prisma.chatParticipant.upsert({
            where: {
              chatId_userId: {
                chatId,
                userId,
              },
            },
            create: {
              chatId,
              userId,
              role: 'member',
            },
            update: {
              leftAt: null, // Rejoin if previously left
            },
          })
        )
      );

      // Update participant count
      const newCount = await prisma.chatParticipant.count({
        where: {
          chatId,
          leftAt: null,
        },
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: {
          participantCount: newCount,
        },
      });

      // Send system message
      const addedUser = await prisma.user.findUnique({
        where: { id: addedBy },
      });

      await this.sendMessage({
        chatId,
        senderId: addedBy,
        content: `${addedUser?.name} added ${participantIds.length} participant(s) to the chat`,
        messageType: MessageType.SYSTEM,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error adding participants:', error);
      return {
        success: false,
        error: error.message || 'Failed to add participants',
      };
    }
  }

  /**
   * Leave chat
   */
  async leaveChat(
    chatId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
      });

      if (!participant) {
        return {
          success: false,
          error: 'User is not a participant in this chat',
        };
      }

      // Mark as left
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          leftAt: new Date(),
        },
      });

      // Update participant count
      const newCount = await prisma.chatParticipant.count({
        where: {
          chatId,
          leftAt: null,
        },
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: {
          participantCount: newCount,
        },
      });

      // Send system message
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      await this.sendMessage({
        chatId,
        senderId: userId,
        content: `${user?.name} left the chat`,
        messageType: MessageType.SYSTEM,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error leaving chat:', error);
      return {
        success: false,
        error: error.message || 'Failed to leave chat',
      };
    }
  }

  /**
   * Find existing direct chat between users
   */
  private async findExistingDirectChat(participantIds: string[]): Promise<{ id: string } | null> {
    try {
      const chats = await prisma.chat.findMany({
        where: {
          type: ChatType.DIRECT,
          isActive: true,
        },
        include: {
          participants: {
            where: {
              leftAt: null,
            },
          },
        },
      });

      for (const chat of chats) {
        const chatParticipantIds = chat.participants.map(p => p.userId).sort();
        const targetIds = [...participantIds].sort();
        
        if (chatParticipantIds.length === targetIds.length &&
            chatParticipantIds.every((id, index) => id === targetIds[index])) {
          return { id: chat.id };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing direct chat:', error);
      return null;
    }
  }

  /**
   * Mark messages as delivered
   */
  private async markMessagesAsDelivered(
    messageIds: string[],
    userId: string
  ): Promise<void> {
    try {
      await prisma.messageDelivery.updateMany({
        where: {
          messageId: { in: messageIds },
          recipientId: userId,
          deliveredAt: null,
        },
        data: {
          deliveredAt: new Date(),
          status: MessageStatus.DELIVERED,
        },
      });
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
    }
  }

  /**
   * Send message notifications
   */
  private async sendMessageNotifications(
    messageId: string,
    recipientIds: string[]
  ): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          sender: true,
          chat: true,
        },
      });

      if (!message) return;

      // Create notifications for recipients
      await Promise.all(
        recipientIds.map(recipientId =>
          prisma.communicationNotification.create({
            data: {
              userId: recipientId,
              type: 'MESSAGE',
              title: message.chat.title || `Message from ${message.sender.name}`,
              message: message.content || '[Media message]',
              data: {
                chatId: message.chatId,
                messageId: message.id,
                senderId: message.senderId,
              },
              priority: 'normal',
            },
          })
        )
      );
    } catch (error) {
      console.error('Error sending message notifications:', error);
    }
  }
}

// Export singleton instance
export const messagingInfrastructureService = new MessagingInfrastructureService();
