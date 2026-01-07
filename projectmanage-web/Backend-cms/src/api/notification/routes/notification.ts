/**
 * notification router
 */

export default {
  routes: [
    // GET /api/notifications - ดึง notifications ของ user ปัจจุบัน
    {
      method: 'GET',
      path: '/notifications',
      handler: 'notification.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    // GET /api/notifications/unread-count - นับจำนวน unread
    {
      method: 'GET',
      path: '/notifications/unread-count',
      handler: 'notification.getUnreadCount',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    // PUT /api/notifications/:id/mark-read - อ่านทีละรายการ
    {
      method: 'PUT',
      path: '/notifications/:id/mark-read',
      handler: 'notification.markAsRead',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    // PUT /api/notifications/mark-all-read - อ่านทั้งหมด
    {
      method: 'PUT',
      path: '/notifications/mark-all-read',
      handler: 'notification.markAllAsRead',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
