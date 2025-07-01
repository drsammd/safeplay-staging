
// WebSocket Service for Real-time Zone Management
export class WebSocketService {
  private static instance: WebSocketService;
  private clients: Map<string, any> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private messageQueue: Map<string, any[]> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Register a new WebSocket client
  async registerClient(clientId: string, subscriptionKey: string, filters: any) {
    this.clients.set(clientId, {
      id: clientId,
      subscriptionKey,
      filters,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Add to subscription map
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey)!.add(clientId);

    console.log(`Client ${clientId} registered for ${subscriptionKey}`);
  }

  // Remove a client
  async unregisterClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from subscription map
      const subscription = this.subscriptions.get(client.subscriptionKey);
      if (subscription) {
        subscription.delete(clientId);
        if (subscription.size === 0) {
          this.subscriptions.delete(client.subscriptionKey);
        }
      }

      // Remove client and cleanup message queue
      this.clients.delete(clientId);
      this.messageQueue.delete(clientId);

      console.log(`Client ${clientId} unregistered`);
    }
  }

  // Subscribe client to specific channels
  async subscribe(clientId: string, channel: string, filters?: any) {
    const client = this.clients.get(clientId);
    if (client) {
      if (!client.channels) {
        client.channels = new Set();
      }
      client.channels.add(channel);

      if (filters) {
        if (!client.channelFilters) {
          client.channelFilters = {};
        }
        client.channelFilters[channel] = filters;
      }

      console.log(`Client ${clientId} subscribed to ${channel}`);
    }
  }

  // Unsubscribe client from specific channels
  async unsubscribe(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (client && client.channels) {
      client.channels.delete(channel);
      if (client.channelFilters) {
        delete client.channelFilters[channel];
      }

      console.log(`Client ${clientId} unsubscribed from ${channel}`);
    }
  }

  // Send message to specific client
  async sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client) {
      // In a real implementation, this would send via WebSocket
      // For now, we'll queue the message
      if (!this.messageQueue.has(clientId)) {
        this.messageQueue.set(clientId, []);
      }
      
      this.messageQueue.get(clientId)!.push({
        ...message,
        timestamp: new Date().toISOString(),
        clientId
      });

      // Update last activity
      client.lastActivity = new Date();

      console.log(`Message sent to client ${clientId}:`, message);
    }
  }

  // Broadcast message to all clients in a venue
  async broadcastToVenue(venueId: string, message: any) {
    const subscriptionKey = `venue:${venueId}`;
    const clientIds = this.subscriptions.get(subscriptionKey);
    
    if (clientIds) {
      const broadcastPromises = Array.from(clientIds).map(clientId =>
        this.sendToClient(clientId, {
          ...message,
          type: 'broadcast',
          venue: venueId
        })
      );

      await Promise.all(broadcastPromises);
      console.log(`Broadcast sent to ${clientIds.size} clients in venue ${venueId}`);
    }
  }

  // Broadcast zone-specific updates
  async broadcastZoneUpdate(venueId: string, zoneId: string, updateData: any) {
    const subscriptionKey = `venue:${venueId}`;
    const clientIds = this.subscriptions.get(subscriptionKey);
    
    if (clientIds) {
      const filteredClients = Array.from(clientIds).filter(clientId => {
        const client = this.clients.get(clientId);
        if (!client || !client.filters) return true;
        
        // Check if client is interested in this zone
        const zoneIds = client.filters.zoneIds;
        return !zoneIds || zoneIds.length === 0 || zoneIds.includes(zoneId);
      });

      const updatePromises = filteredClients.map(clientId =>
        this.sendToClient(clientId, {
          type: 'zone_update',
          zoneId,
          venueId,
          data: updateData,
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      console.log(`Zone update sent to ${filteredClients.length} clients for zone ${zoneId}`);
    }
  }

  // ================================
  // MESSAGING AND COMMUNICATION EXTENSIONS
  // ================================

  // Subscribe client to chat updates
  async subscribeToChatUpdates(clientId: string, chatIds: string[]) {
    for (const chatId of chatIds) {
      await this.subscribe(clientId, `chat:${chatId}`);
    }
  }

  // Subscribe client to user-specific notifications
  async subscribeToUserNotifications(clientId: string, userId: string) {
    await this.subscribe(clientId, `user:${userId}:notifications`);
  }

  // Subscribe client to navigation updates
  async subscribeToNavigationUpdates(clientId: string, navigationRequestId: string) {
    await this.subscribe(clientId, `navigation:${navigationRequestId}`);
  }

  // Send real-time chat message
  async sendChatMessage(chatId: string, message: any) {
    const channel = `chat:${chatId}`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const messagePromises = clientIds.map(clientId =>
        this.sendToClient(clientId, {
          type: 'chat_message',
          chatId,
          message: {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            senderId: message.senderId,
            senderName: message.senderName,
            sentAt: message.sentAt,
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType,
          },
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(messagePromises);
      console.log(`Chat message sent to ${clientIds.length} clients in chat ${chatId}`);
    }
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, userId: string, userName: string, isTyping: boolean) {
    const channel = `chat:${chatId}`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const typingPromises = clientIds
        .filter(clientId => {
          const client = this.clients.get(clientId);
          return client && client.userId !== userId; // Don't send to the typer
        })
        .map(clientId =>
          this.sendToClient(clientId, {
            type: 'typing_indicator',
            chatId,
            userId,
            userName,
            isTyping,
            timestamp: new Date().toISOString()
          })
        );

      await Promise.all(typingPromises);
    }
  }

  // Send permission request notification
  async sendPermissionNotification(parentId: string, notification: any) {
    const channel = `user:${parentId}:notifications`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const notificationPromises = clientIds.map(clientId =>
        this.sendToClient(clientId, {
          type: 'permission_request',
          notification: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            priority: notification.priority,
            createdAt: notification.createdAt,
          },
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Permission notification sent to ${clientIds.length} clients for user ${parentId}`);
    }
  }

  // Send friendship detection alert
  async sendFriendshipAlert(parentIds: string[], friendshipData: any) {
    const alertPromises = parentIds.map(async parentId => {
      const channel = `user:${parentId}:notifications`;
      const clientIds = this.getSubscribedClients(channel);
      
      if (clientIds.length > 0) {
        const promises = clientIds.map(clientId =>
          this.sendToClient(clientId, {
            type: 'friendship_detected',
            friendship: {
              id: friendshipData.id,
              children: friendshipData.children,
              status: friendshipData.status,
              confidenceScore: friendshipData.confidenceScore,
              detectedAt: friendshipData.detectedAt,
            },
            timestamp: new Date().toISOString()
          })
        );
        
        await Promise.all(promises);
      }
    });

    await Promise.all(alertPromises);
    console.log(`Friendship alert sent to ${parentIds.length} parents`);
  }

  // Send navigation progress update
  async sendNavigationUpdate(navigationRequestId: string, updateData: any) {
    const channel = `navigation:${navigationRequestId}`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const updatePromises = clientIds.map(clientId =>
        this.sendToClient(clientId, {
          type: 'navigation_update',
          navigationRequestId,
          update: {
            currentLocation: updateData.currentLocation,
            nextWaypoint: updateData.nextWaypoint,
            remainingTime: updateData.remainingTime,
            progress: updateData.progress,
          },
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      console.log(`Navigation update sent to ${clientIds.length} clients for request ${navigationRequestId}`);
    }
  }

  // Send community activity notification
  async sendCommunityNotification(groupId: string, notification: any) {
    // Get all group members
    const { prisma } = await import('../db');
    
    try {
      const groupMembers = await prisma.communityMember.findMany({
        where: {
          groupId,
          leftAt: null,
        },
        select: { userId: true },
      });

      const notificationPromises = groupMembers.map(async member => {
        const channel = `user:${member.userId}:notifications`;
        const clientIds = this.getSubscribedClients(channel);
        
        if (clientIds.length > 0) {
          const promises = clientIds.map(clientId =>
            this.sendToClient(clientId, {
              type: 'community_notification',
              groupId,
              notification: {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                data: notification.data,
                createdAt: notification.createdAt,
              },
              timestamp: new Date().toISOString()
            })
          );
          
          await Promise.all(promises);
        }
      });

      await Promise.all(notificationPromises);
      console.log(`Community notification sent to ${groupMembers.length} group members`);
    } catch (error) {
      console.error('Error sending community notification:', error);
    }
  }

  // Send parent connection notification
  async sendConnectionNotification(parentId: string, connectionData: any) {
    const channel = `user:${parentId}:notifications`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const connectionPromises = clientIds.map(clientId =>
        this.sendToClient(clientId, {
          type: 'parent_connection',
          connection: {
            id: connectionData.id,
            otherParent: connectionData.otherParent,
            status: connectionData.status,
            message: connectionData.message,
            requestedAt: connectionData.requestedAt,
            respondedAt: connectionData.respondedAt,
          },
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(connectionPromises);
      console.log(`Connection notification sent to ${clientIds.length} clients for user ${parentId}`);
    }
  }

  // Send emergency broadcast to all connected users
  async sendEmergencyBroadcast(venueId: string, emergencyData: any) {
    const subscriptionKey = `venue:${venueId}`;
    const clientIds = this.subscriptions.get(subscriptionKey);
    
    if (clientIds) {
      const emergencyPromises = Array.from(clientIds).map(clientId =>
        this.sendToClient(clientId, {
          type: 'emergency_broadcast',
          venueId,
          emergency: {
            title: emergencyData.title,
            message: emergencyData.message,
            severity: emergencyData.severity,
            instructions: emergencyData.instructions,
            timestamp: new Date().toISOString(),
          },
          priority: 'urgent'
        })
      );

      await Promise.all(emergencyPromises);
      console.log(`Emergency broadcast sent to ${clientIds.size} clients in venue ${venueId}`);
    }
  }

  // Send media sharing notification
  async sendMediaSharingNotification(parentId: string, mediaData: any) {
    const channel = `user:${parentId}:notifications`;
    const clientIds = this.getSubscribedClients(channel);
    
    if (clientIds.length > 0) {
      const mediaPromises = clientIds.map(clientId =>
        this.sendToClient(clientId, {
          type: 'media_sharing',
          media: {
            id: mediaData.id,
            title: mediaData.title,
            mediaType: mediaData.mediaType,
            thumbnailUrl: mediaData.thumbnailUrl,
            taggedChildren: mediaData.taggedChildren,
            uploadedBy: mediaData.uploadedBy,
            permission: mediaData.permission,
          },
          timestamp: new Date().toISOString()
        })
      );

      await Promise.all(mediaPromises);
      console.log(`Media sharing notification sent to ${clientIds.length} clients for user ${parentId}`);
    }
  }

  // Helper method to get subscribed clients for a channel
  private getSubscribedClients(channel: string): string[] {
    const clientIds: string[] = [];
    
    for (const [clientId, client] of this.clients.entries()) {
      if (client.channels && client.channels.has(channel)) {
        clientIds.push(clientId);
      }
    }
    
    return clientIds;
  }

  // Enhanced client registration for messaging features
  async registerMessagingClient(clientId: string, userId: string, subscriptionKey: string, filters: any) {
    await this.registerClient(clientId, subscriptionKey, filters);
    
    // Add user ID to client data for targeted messaging
    const client = this.clients.get(clientId);
    if (client) {
      client.userId = userId;
      
      // Auto-subscribe to user notifications
      await this.subscribeToUserNotifications(clientId, userId);
    }
  }

  // Get client activity status
  getClientActivity(): any {
    const activity = {
      totalClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      clientsByVenue: new Map(),
      clientsByChannel: new Map(),
    };

    // Group clients by venue
    for (const [clientId, client] of this.clients.entries()) {
      if (client.subscriptionKey?.startsWith('venue:')) {
        const venueId = client.subscriptionKey.split(':')[1];
        if (!activity.clientsByVenue.has(venueId)) {
          activity.clientsByVenue.set(venueId, []);
        }
        activity.clientsByVenue.get(venueId).push({
          clientId,
          connectedAt: client.connectedAt,
          lastActivity: client.lastActivity,
        });
      }
    }

    // Group clients by channel
    for (const [clientId, client] of this.clients.entries()) {
      if (client.channels) {
        for (const channel of client.channels) {
          if (!activity.clientsByChannel.has(channel)) {
            activity.clientsByChannel.set(channel, []);
          }
          activity.clientsByChannel.get(channel).push(clientId);
        }
      }
    }

    return {
      ...activity,
      clientsByVenue: Object.fromEntries(activity.clientsByVenue),
      clientsByChannel: Object.fromEntries(activity.clientsByChannel),
    };
  }

  // Get pending messages for a client
  getPendingMessages(clientId: string) {
    return this.messageQueue.get(clientId) || [];
  }

  // Clear message queue for a client
  clearMessageQueue(clientId: string) {
    this.messageQueue.delete(clientId);
  }

  // Cleanup inactive clients
  async cleanupInactiveClients(inactiveThresholdMinutes: number = 30) {
    const threshold = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
    const inactiveClients: string[] = [];

    for (const [clientId, client] of this.clients.entries()) {
      if (client.lastActivity < threshold) {
        inactiveClients.push(clientId);
      }
    }

    for (const clientId of inactiveClients) {
      await this.unregisterClient(clientId);
    }

    if (inactiveClients.length > 0) {
      console.log(`Cleaned up ${inactiveClients.length} inactive clients`);
    }

    return inactiveClients.length;
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
