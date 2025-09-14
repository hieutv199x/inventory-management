import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  orderId?: string;
  conversationId?: string;
  shopId?: string;
  data?: any; // Additional data as object (will be stringified)
}

export class NotificationService {
  
  static async createNotification(notificationData: NotificationData) {
    try {
      // 1. Always include all active admin / manager users
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MANAGER'] },
          isActive: true
        },
        select: { id: true }
      });

      const recipientIds = new Set<string>(adminUsers.map(a => a.id));

      // 2. If shopId provided, add all active users with a role on that shop
      if (notificationData.shopId) {
        const shopUsers = await prisma.userShopRole.findMany({
          where: {
            shopId: notificationData.shopId,
            user: { isActive: true }
          },
          include: { user: { select: { id: true } } }
        });
        for (const su of shopUsers) {
          if (su.user) recipientIds.add(su.user.id);
        }
      }

      // 3. Optionally include the explicit userId if provided and active (not mandatory but keeps backward compatibility)
      if (notificationData.userId && notificationData.userId !== 'system') {
        const explicit = await prisma.user.findUnique({
          where: { id: notificationData.userId }
        });
        if (explicit?.isActive) recipientIds.add(explicit.id);
      }

      if (recipientIds.size === 0) {
        console.warn('No recipients resolved for notification');
        return null;
      }

      const payload = {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        orderId: notificationData.orderId,
        conversationId: notificationData.conversationId,
        shopId: notificationData.shopId,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null
      };

      const created: any[] = [];
      for (const userId of recipientIds) {
        try {
          const n = await prisma.notification.create({
            data: { ...payload, userId }
          });
            created.push(n);
        } catch (e) {
          console.error('Failed creating notification for user', userId, e);
        }
      }

      console.log(`Created ${created.length} notifications (admins +${notificationData.shopId ? ' shop users' : ''})`);
      // Return first for backward compatibility
      return created[0] || null;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createOrderNotification(
    type: 'NEW_ORDER' | 'ORDER_STATUS_CHANGE' | 'ORDER_CANCELLED' | 'ORDER_DELIVERED',
    order: any,
    shopId: string,
    additionalData?: any
  ) {
    try {
      // Get all users who have access to this shop
      const shopUsers = await prisma.userShopRole.findMany({
        where: { shopId },
        include: { user: true }
      });

      const notifications = [];
      for (const shopUser of shopUsers) {
        let title = '';
        let message = '';

        switch (type) {
          case NotificationType.NEW_ORDER:
            title = 'New Order Received';
            message = `New order ${order.orderId} received from ${order.buyerEmail}`;
            break;
          case NotificationType.ORDER_STATUS_CHANGE:
            title = 'Order Status Updated';
            message = `Order ${order.orderId} status changed to ${order.status}`;
            break;
          case NotificationType.ORDER_CANCELLED:
            title = 'Order Cancelled';
            message = `Order ${order.orderId} has been cancelled`;
            break;
          case NotificationType.ORDER_DELIVERED:
            title = 'Order Delivered';
            message = `Order ${order.orderId} has been delivered successfully`;
            break;
        }

        const notification = await this.createNotification({
          type,
          title,
          message,
          userId: shopUser.userId,
          orderId: order.id,
          shopId,
          data: {
            orderAmount: order.totalAmount,
            currency: order.currency,
            customerEmail: order.buyerEmail,
            ...additionalData
          }
        });

        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating order notification:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId // Ensure user can only mark their own notifications as read
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, limit = 20, offset = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: {
          order: {
            select: { orderId: true, status: true, totalAmount: true, currency: true }
          },
          conversation: {
            select: { conversationId: true, participantCount: true }
          },
          shop: {
            select: { shopName: true, shopId: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          read: false
        }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          read: true // Only delete read notifications
        }
      });

      console.log(`Deleted ${result.count} old notifications`);
      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}