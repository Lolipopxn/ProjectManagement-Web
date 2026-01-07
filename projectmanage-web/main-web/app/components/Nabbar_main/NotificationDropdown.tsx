"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface User {
  id: number;
  username: string;
  email: string;
}

interface NotificationDropdownProps {
  notifications: any[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  isLoading: boolean;
  currentUser: User | null;
}

export default function NotificationDropdown({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading,
  currentUser,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // กรอง notifications ที่เป็นของ user ปัจจุบันเท่านั้น
  const userNotifications = currentUser 
    ? notifications.filter(n => {
        // ตรวจสอบว่า notification นี้เป็นของ user ปัจจุบันหรือไม่
        const recipientId = n.recipient?.id || n.recipient;
        return recipientId === currentUser.id;
      })
    : notifications;

  // Debug logging
  console.log("=== NOTIFICATION DROPDOWN DEBUG ===");
  console.log("Current User:", currentUser);
  console.log("All Notifications:", notifications.length);
  console.log("User Notifications (filtered):", userNotifications.length);
  if (notifications.length > 0) {
    console.log("First notification sample:", notifications[0]);
  }
  console.log("===================================");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_due_reminder":
        return "⏰";
      case "project_invitation":
        return "📨";
      case "task_assigned":
        return "📌";
      case "task_status_changed":
        return "🔄";
      case "project_created":
        return "🎉";
      default:
        return "🔔";
    }
  };

  const getUrgencyColor = (notification: any) => {
    // สำหรับ task reminders
    if (notification.type === "task_due_reminder" && notification.metadata) {
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata;
      
      if (metadata.daysLeft === 1) return "border-l-4 border-red-500 bg-red-50";
      if (metadata.daysLeft === 3) return "border-l-4 border-orange-500 bg-orange-50";
      if (metadata.daysLeft === 7) return "border-l-4 border-yellow-500 bg-yellow-50";
    }
    
    return "";
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    try {
      const metadata = notification.metadata || {};

      if (notification.type === "task_due_reminder" && metadata?.taskDocumentId && metadata?.projectDocumentId) {
        // ไปที่หน้า task ในโปรเจ็กต์
        router.push(`/main_pages/projects/${metadata.projectDocumentId}/tasks?highlight=${metadata.taskDocumentId}`);
      } else if (metadata?.projectDocumentId) {
        // ไปที่หน้าโปรเจ็กต์
        router.push(`/main_pages/project-overview/${metadata.projectDocumentId}`);
      } else if (notification.related_project?.documentId) {
        router.push(`/main_pages/project-overview/${notification.related_project.documentId}`);
      }
    } catch (e) {
      console.error("Error handling notification click:", e);
    }

    onClose();
  };

  // แยก notifications ตามประเภท (ใช้ userNotifications ที่กรองแล้ว)
  const taskReminders = userNotifications.filter(n => n.type === "task_due_reminder");
  const otherNotifications = userNotifications.filter(n => n.type !== "task_due_reminder");

  const renderNotification = (notification: any) => {
    const metadata = notification.metadata || {};
    const sender = notification.sender;

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
          !notification.is_read ? "bg-blue-50" : ""
        } ${getUrgencyColor(notification)}`}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {notification.title && (
              <p className="font-semibold text-sm text-gray-900 mb-1">
                {notification.title}
              </p>
            )}

            {/* Sender info - แสดงว่าใครส่ง */}
            {sender && (sender.username || sender.email) && (
              <p className="text-xs text-gray-500 mb-1">
                จาก: {sender.username || sender.email}
              </p>
            )}

            {/* Message */}
            <p className="text-sm text-gray-700 break-words line-clamp-2">
              {notification.message}
            </p>

            {/* Metadata info */}
            {metadata.projectName && (
              <p className="text-xs text-gray-500 mt-1">
                โปรเจ็กต์: {metadata.projectName}
              </p>
            )}

            {/* Time */}
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: th,
              })}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.is_read && (
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">การแจ้งเตือน</h3>
        {userNotifications.some(n => !n.is_read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔕</div>
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            {currentUser && (
              <p className="text-xs text-gray-400 mt-2">
                สำหรับ {currentUser.username}
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Task Reminders Section */}
            {taskReminders.length > 0 && (
              <>
                <div className="px-4 py-2 bg-yellow-50">
                  <p className="text-xs font-semibold text-yellow-800 uppercase">
                    ⏰ งานที่กำลังจะครบกำหนด ({taskReminders.length})
                  </p>
                </div>
                {taskReminders.map(renderNotification)}
              </>
            )}

            {/* Other Notifications */}
            {otherNotifications.length > 0 && (
              <>
                {taskReminders.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      🔔 อื่นๆ ({otherNotifications.length})
                    </p>
                  </div>
                )}
                {otherNotifications.map(renderNotification)}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {userNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <a
            href="/main_pages/notifications"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium text-center block"
            onClick={onClose}
          >
            ดูการแจ้งเตือนทั้งหมด →
          </a>
        </div>
      )}
    </div>
  );
}
