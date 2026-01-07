/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  /**
   * Get notifications for current user
   */
  async find(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      strapi.log.info(`🔔 Fetching notifications for user ${user.id} (${user.username})`);
      
      // Get limit from query params
      const queryParams = ctx.query as any;
      const limit = queryParams?.pagination?.limit || 50;
      
      // ดึง notifications ของ user ปัจจุบัน โดยใช้ Document Service API
      const notifications = await strapi.documents('api::notification.notification').findMany({
        filters: {
          recipient: {
            id: user.id, // Filter โดย recipient.id
          },
        },
        populate: ['recipient', 'sender', 'related_project'],
        sort: 'createdAt:desc',
        limit: limit,
      });

      strapi.log.info(`✅ Found ${notifications.length} notifications for user ${user.id}`);

      // ส่งกลับในรูปแบบ Strapi API standard
      return { data: notifications };
    } catch (error) {
      strapi.log.error('Error fetching notifications:', error);
      return ctx.badRequest('Failed to fetch notifications');
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      const notifications = await strapi.documents('api::notification.notification').findMany({
        filters: {
          recipient: {
            id: user.id,
          },
          is_read: false,
        },
      });

      const count = notifications.length;
      strapi.log.info(`📊 User ${user.id} has ${count} unread notifications`);

      return { count };
    } catch (error) {
      strapi.log.error('Error counting notifications:', error);
      return ctx.badRequest('Failed to count notifications');
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // ตรวจสอบว่า notification นี้เป็นของ user หรือไม่
      const notification = await strapi.entityService.findOne(
        'api::notification.notification',
        id,
        {
          populate: {
            recipient: {
              fields: ['id'],
            },
          },
        }
      );

      if (!notification) {
        return ctx.notFound('Notification not found');
      }

      // เช็ค recipient ID (cast เป็น any เพื่อเข้าถึง populated field)
      const notifWithRecipient = notification as any;
      const recipientId = notifWithRecipient.recipient?.id || notifWithRecipient.recipient;
      
      if (recipientId !== user.id) {
        return ctx.forbidden('You cannot modify this notification');
      }

      // Update notification
      const updated = await strapi.entityService.update(
        'api::notification.notification',
        id,
        {
          data: {
            is_read: true,
          },
        }
      );

      return updated;
    } catch (error) {
      strapi.log.error('Error marking notification as read:', error);
      return ctx.badRequest('Failed to update notification');
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // ดึง unread notifications ทั้งหมด
      const unreadNotifications = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            recipient: user.id,
            is_read: false,
          },
        }
      );

      // Update ทั้งหมด
      await Promise.all(
        unreadNotifications.map(notif =>
          strapi.entityService.update(
            'api::notification.notification',
            notif.id,
            {
              data: { is_read: true },
            }
          )
        )
      );

      return { success: true, updated: unreadNotifications.length };
    } catch (error) {
      strapi.log.error('Error marking all as read:', error);
      return ctx.badRequest('Failed to update notifications');
    }
  },
}));
