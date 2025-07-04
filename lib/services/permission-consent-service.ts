
// @ts-nocheck
import { prisma } from '../db';
import { ConsentPreference, PermissionStatus } from '@prisma/client';

export interface PermissionRequest {
  mediaId: string;
  childId: string;
  parentId: string;
  requestType: 'media_share' | 'friend_connection' | 'activity_participation';
  context?: string;
  expiresIn?: number; // hours
}

export interface ConsentDecision {
  granted: boolean;
  reason?: string;
  conditions?: string[];
  expiresAt?: Date;
}

export interface BulkPermissionRequest {
  mediaIds: string[];
  affectedParents: Array<{
    parentId: string;
    childIds: string[];
  }>;
  requestType: 'event_photos' | 'activity_album' | 'group_media';
  eventContext?: string;
}

export class PermissionConsentService {
  /**
   * Request permission for media sharing
   */
  async requestMediaPermission(request: PermissionRequest): Promise<{
    success: boolean;
    permissionId?: string;
    autoGranted?: boolean;
    requiresApproval?: boolean;
    error?: string;
  }> {
    try {
      const { mediaId, childId, parentId, requestType, context, expiresIn } = request;

      // Check parent's consent preferences
      const privacySettings = await prisma.privacySettings.findUnique({
        where: { userId: parentId },
      });

      const consentPreference = privacySettings?.mediaShareConsent || ConsentPreference.ASK_EACH_TIME;

      // Calculate expiration time
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

      // Handle auto-grant scenarios
      if (consentPreference === ConsentPreference.ALWAYS_ALLOW) {
        const permission = await prisma.mediaPermission.create({
          data: {
            mediaId,
            childId,
            parentId,
            status: PermissionStatus.GRANTED,
            respondedAt: new Date(),
            expiresAt,
            autoGranted: true,
            notes: 'Auto-granted based on parent preferences',
          },
        });

        return {
          success: true,
          permissionId: permission.id,
          autoGranted: true,
          requiresApproval: false,
        };
      }

      // Handle auto-deny scenarios
      if (consentPreference === ConsentPreference.NEVER_ALLOW) {
        const permission = await prisma.mediaPermission.create({
          data: {
            mediaId,
            childId,
            parentId,
            status: PermissionStatus.DENIED,
            respondedAt: new Date(),
            autoGranted: true,
            notes: 'Auto-denied based on parent preferences',
          },
        });

        return {
          success: true,
          permissionId: permission.id,
          autoGranted: true,
          requiresApproval: false,
        };
      }

      // Handle friend-only permissions
      if (consentPreference === ConsentPreference.FRIENDS_ONLY) {
        const hasConnection = await this.checkParentConnection(parentId, mediaId);
        
        if (hasConnection) {
          const permission = await prisma.mediaPermission.create({
            data: {
              mediaId,
              childId,
              parentId,
              status: PermissionStatus.GRANTED,
              respondedAt: new Date(),
              expiresAt,
              autoGranted: true,
              connectionBonus: true,
              notes: 'Auto-granted for connected families',
            },
          });

          return {
            success: true,
            permissionId: permission.id,
            autoGranted: true,
            requiresApproval: false,
          };
        }
      }

      // Default: require explicit approval
      const permission = await prisma.mediaPermission.create({
        data: {
          mediaId,
          childId,
          parentId,
          status: PermissionStatus.PENDING,
          expiresAt,
          notes: context,
        },
      });

      // Send notification to parent
      await this.sendPermissionNotification(permission.id, parentId, requestType);

      return {
        success: true,
        permissionId: permission.id,
        autoGranted: false,
        requiresApproval: true,
      };
    } catch (error: any) {
      console.error('Error requesting media permission:', error);
      return {
        success: false,
        error: error.message || 'Permission request failed',
      };
    }
  }

  /**
   * Process parent's consent decision
   */
  async processConsentDecision(
    permissionId: string,
    parentId: string,
    decision: ConsentDecision
  ): Promise<{
    success: boolean;
    connectionBonusEligible?: boolean;
    error?: string;
  }> {
    try {
      const permission = await prisma.mediaPermission.findUnique({
        where: { id: permissionId },
        include: {
          media: true,
          child: true,
        },
      });

      if (!permission) {
        return {
          success: false,
          error: 'Permission request not found',
        };
      }

      if (permission.parentId !== parentId) {
        return {
          success: false,
          error: 'Unauthorized to respond to this permission request',
        };
      }

      // Update permission status
      await prisma.mediaPermission.update({
        where: { id: permissionId },
        data: {
          status: decision.granted ? PermissionStatus.GRANTED : PermissionStatus.DENIED,
          respondedAt: new Date(),
          expiresAt: decision.expiresAt || permission.expiresAt,
          notes: decision.reason,
        },
      });

      // Check for connection bonus eligibility
      let connectionBonusEligible = false;
      if (decision.granted && !permission.connectionBonus) {
        connectionBonusEligible = await this.checkConnectionBonusEligibility(
          parentId,
          permission.media.uploadedById
        );

        if (connectionBonusEligible) {
          await this.offerConnectionBonus(parentId, permission.media.uploadedById, permissionId);
        }
      }

      // Send confirmation notification
      await this.sendConsentConfirmation(permissionId, decision.granted);

      return {
        success: true,
        connectionBonusEligible,
      };
    } catch (error: any) {
      console.error('Error processing consent decision:', error);
      return {
        success: false,
        error: error.message || 'Failed to process consent decision',
      };
    }
  }

  /**
   * Handle bulk permission requests for events/activities
   */
  async requestBulkPermissions(bulkRequest: BulkPermissionRequest): Promise<{
    success: boolean;
    results: Array<{
      parentId: string;
      permissionIds: string[];
      autoGranted: boolean;
      requiresApproval: boolean;
    }>;
    summary: {
      totalRequests: number;
      autoGranted: number;
      requiresApproval: number;
    };
    error?: string;
  }> {
    try {
      const { mediaIds, affectedParents, requestType, eventContext } = bulkRequest;
      const results: Array<{
        parentId: string;
        permissionIds: string[];
        autoGranted: boolean;
        requiresApproval: boolean;
      }> = [];

      let totalAutoGranted = 0;
      let totalRequiresApproval = 0;

      for (const parentGroup of affectedParents) {
        const { parentId, childIds } = parentGroup;
        const permissionIds: string[] = [];
        let allAutoGranted = true;

        for (const mediaId of mediaIds) {
          for (const childId of childIds) {
            // Check if child is actually in this media
            const media = await prisma.sharedMedia.findUnique({
              where: { id: mediaId },
            });

            if (media && media.taggedChildren.includes(childId)) {
              const permissionResult = await this.requestMediaPermission({
                mediaId,
                childId,
                parentId,
                requestType: 'media_share',
                context: eventContext,
                expiresIn: 72, // 3 days for event photos
              });

              if (permissionResult.success && permissionResult.permissionId) {
                permissionIds.push(permissionResult.permissionId);
                if (!permissionResult.autoGranted) {
                  allAutoGranted = false;
                }
              }
            }
          }
        }

        results.push({
          parentId,
          permissionIds,
          autoGranted: allAutoGranted,
          requiresApproval: !allAutoGranted,
        });

        if (allAutoGranted) {
          totalAutoGranted++;
        } else {
          totalRequiresApproval++;
        }
      }

      return {
        success: true,
        results,
        summary: {
          totalRequests: affectedParents.length,
          autoGranted: totalAutoGranted,
          requiresApproval: totalRequiresApproval,
        },
      };
    } catch (error: any) {
      console.error('Error requesting bulk permissions:', error);
      return {
        success: false,
        results: [],
        summary: {
          totalRequests: 0,
          autoGranted: 0,
          requiresApproval: 0,
        },
        error: error.message || 'Bulk permission request failed',
      };
    }
  }

  /**
   * Check if parent has connection with media uploader
   */
  private async checkParentConnection(parentId: string, mediaId: string): Promise<boolean> {
    try {
      const media = await prisma.sharedMedia.findUnique({
        where: { id: mediaId },
      });

      if (!media) return false;

      const connection = await prisma.parentConnection.findFirst({
        where: {
          OR: [
            { requesterId: parentId, receiverId: media.uploadedById, status: 'ACCEPTED' },
            { requesterId: media.uploadedById, receiverId: parentId, status: 'ACCEPTED' },
          ],
        },
      });

      return !!connection;
    } catch (error) {
      console.error('Error checking parent connection:', error);
      return false;
    }
  }

  /**
   * Send permission notification to parent
   */
  private async sendPermissionNotification(
    permissionId: string,
    parentId: string,
    requestType: string
  ): Promise<void> {
    try {
      await prisma.communicationNotification.create({
        data: {
          userId: parentId,
          type: 'PERMISSION_REQUEST',
          title: 'Media Sharing Permission Request',
          message: `A new ${requestType} permission request requires your approval.`,
          data: {
            permissionId,
            requestType,
            actionRequired: true,
          },
          priority: 'normal',
        },
      });
    } catch (error) {
      console.error('Error sending permission notification:', error);
    }
  }

  /**
   * Check eligibility for connection bonus
   */
  private async checkConnectionBonusEligibility(
    parentId1: string,
    parentId2: string
  ): Promise<boolean> {
    try {
      // Check if they don't already have a connection
      const existingConnection = await prisma.parentConnection.findFirst({
        where: {
          OR: [
            { requesterId: parentId1, receiverId: parentId2 },
            { requesterId: parentId2, receiverId: parentId1 },
          ],
        },
      });

      if (existingConnection) return false;

      // Check if their children have detected friendships
      const children1 = await prisma.child.findMany({
        where: { parentId: parentId1 },
      });

      const children2 = await prisma.child.findMany({
        where: { parentId: parentId2 },
      });

      for (const child1 of children1) {
        for (const child2 of children2) {
          const friendship = await prisma.childFriendship.findFirst({
            where: {
              OR: [
                { child1Id: child1.id, child2Id: child2.id },
                { child1Id: child2.id, child2Id: child1.id },
              ],
              status: 'DETECTED',
            },
          });

          if (friendship) return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking connection bonus eligibility:', error);
      return false;
    }
  }

  /**
   * Offer connection bonus to parent
   */
  private async offerConnectionBonus(
    parentId1: string,
    parentId2: string,
    permissionId: string
  ): Promise<void> {
    try {
      // Send notification about connection bonus opportunity
      await Promise.all([
        prisma.communicationNotification.create({
          data: {
            userId: parentId1,
            type: 'COMMUNITY_INVITE',
            title: 'Connection Bonus Available!',
            message: 'Connect with this family to receive free media copies in the future.',
            data: {
              bonusType: 'media_connection',
              targetParentId: parentId2,
              triggerPermissionId: permissionId,
            },
            priority: 'normal',
          },
        }),
        prisma.communicationNotification.create({
          data: {
            userId: parentId2,
            type: 'COMMUNITY_INVITE',
            title: 'Family Connection Opportunity',
            message: 'Another family is interested in connecting. Connect to share media easily!',
            data: {
              bonusType: 'media_connection',
              targetParentId: parentId1,
              triggerPermissionId: permissionId,
            },
            priority: 'normal',
          },
        }),
      ]);
    } catch (error) {
      console.error('Error offering connection bonus:', error);
    }
  }

  /**
   * Send consent confirmation
   */
  private async sendConsentConfirmation(
    permissionId: string,
    granted: boolean
  ): Promise<void> {
    try {
      const permission = await prisma.mediaPermission.findUnique({
        where: { id: permissionId },
        include: {
          media: {
            include: {
              uploadedBy: true,
            },
          },
        },
      });

      if (!permission) return;

      // Notify the media uploader about the decision
      await prisma.communicationNotification.create({
        data: {
          userId: permission.media.uploadedById,
          type: 'MEDIA_SHARE',
          title: granted ? 'Media Sharing Approved' : 'Media Sharing Declined',
          message: granted 
            ? 'Your media sharing request has been approved.'
            : 'Your media sharing request has been declined.',
          data: {
            permissionId,
            granted,
            mediaId: permission.mediaId,
          },
          priority: 'normal',
        },
      });
    } catch (error) {
      console.error('Error sending consent confirmation:', error);
    }
  }

  /**
   * Get pending permissions for a parent
   */
  async getPendingPermissions(parentId: string): Promise<Array<{
    id: string;
    mediaTitle: string;
    childName: string;
    requestedAt: Date;
    expiresAt: Date;
    context?: string;
    mediaType: string;
    uploaderName: string;
  }>> {
    try {
      const permissions = await prisma.mediaPermission.findMany({
        where: {
          parentId,
          status: PermissionStatus.PENDING,
          expiresAt: {
            gte: new Date(),
          },
        },
        include: {
          media: {
            include: {
              uploadedBy: true,
            },
          },
          child: true,
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });

      return permissions.map(permission => ({
        id: permission.id,
        mediaTitle: permission.media.title || 'Untitled Media',
        childName: `${permission.child.firstName} ${permission.child.lastName}`,
        requestedAt: new Date(permission.requestedAt),
        expiresAt: new Date(permission.expiresAt || new Date()),
        context: permission.notes || undefined,
        mediaType: permission.media.mediaType,
        uploaderName: permission.media.uploadedBy.name,
      }));
    } catch (error) {
      console.error('Error getting pending permissions:', error);
      return [];
    }
  }

  /**
   * Revoke previously granted permission
   */
  async revokePermission(
    permissionId: string,
    parentId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const permission = await prisma.mediaPermission.findUnique({
        where: { id: permissionId },
      });

      if (!permission) {
        return {
          success: false,
          error: 'Permission not found',
        };
      }

      if (permission.parentId !== parentId) {
        return {
          success: false,
          error: 'Unauthorized to revoke this permission',
        };
      }

      if (permission.status !== PermissionStatus.GRANTED) {
        return {
          success: false,
          error: 'Permission is not currently granted',
        };
      }

      await prisma.mediaPermission.update({
        where: { id: permissionId },
        data: {
          status: PermissionStatus.REVOKED,
          respondedAt: new Date(),
          notes: reason || 'Permission revoked by parent',
        },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error revoking permission:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke permission',
      };
    }
  }
}

// Export singleton instance
export const permissionConsentService = new PermissionConsentService();
