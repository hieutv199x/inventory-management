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
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId: notificationData.userId,
          orderId: notificationData.orderId,
          conversationId: notificationData.conversationId,
          shopId: notificationData.shopId,
          data: notificationData.data ? JSON.stringify(notificationData.data) : null,
        },
      });
      
      console.log(`Created notification: ${notification.id} for user: ${notificationData.userId}`);
      return notification;
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
