"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import NotificationDropdown from "./NotificationDropdown";

import { MdSpaceDashboard, MdNotifications } from "react-icons/md";
import { FaFolder, FaPlus } from "react-icons/fa";

interface User {
  id: number;
  username: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ดึงข้อมูล user เมื่อ component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // ดึงข้อมูล notifications เมื่อ component mount
  useEffect(() => {
    fetchNotifications();
    
    // Refresh ทุก 30 วินาที (สำหรับ real-time notifications)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      console.log("Fetching notifications...");
      
      // ใช้ Next.js API route แทนการเรียก Strapi โดยตรง
      const response = await axios.get('/api/notifications');
      
      // console.log("=== NOTIFICATION DEBUG ===");
      // console.log("Response status:", response.status);
      // console.log("Response data:", response.data);
      
      // API route จะส่ง { notifications: [...] }
      const allNotifications = response.data.notifications || [];
      
      // console.log("Parsed notifications:", allNotifications);
      // console.log("Number of notifications:", allNotifications.length);
      
      if (allNotifications.length > 0) {
        console.log("First notification sample:", allNotifications[0]);
      }
      
      setNotifications(allNotifications);
      
      // นับจำนวน notification ที่ยังไม่ได้อ่าน
      const unread = allNotifications.filter((n: any) => !n.is_read).length;
      console.log("Unread count:", unread);
      console.log("=========================");
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/mark-read`);
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };
  
  return (
    <nav className="bg-[#50589C] text-white px-6 md:px-6 py-2 fixed top-0 left-0 w-full z-50">
      <div className="container reactive mx-auto h-auto max-w-full flex items-center justify-between">
        {/* Left side - App name and navigation */}
        <div className="flex items-center space-x-5 md:space-x-20 text-lg md:text-md">
          <a href="/main_pages/overview" className="font-semibold">
            <img src="/TAMA2.png" alt="Logo" className="h-8 w-23 md:h-8 md:w-full"/>
          </a>

          {/* Navigation Links */}
          {/* <ul className="hidden gap-8 md:flex md:flex-row">
            <li className="flex items-center">
              <a
                href="/main_pages/dashboard"
                className="flex flex-row gap-1 items-center hover:text-[#F2AEBB]"
              >
                <MdSpaceDashboard size={20} />
                <div>Dashboard</div>
              </a>
            </li>
            <li className="flex items-center">
              <a
                href="/main_pages/overview"
                className="flex flex-row gap-1 items-center hover:text-[#F2AEBB]"
              >
                <FaFolder size={20} />
                <div>overview</div>
              </a>
            </li>
          </ul> */}
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:inline flex-1 max-w-xl md:mx-10 mr-6">
          <SearchBar />
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-row justify-end items-center md:space-x-6">
          {/* Create project button */}
          {/* <a href="/main_pages/create-project" className="hidden md:flex flex-row justify-center items-center gap-2 p-1 px-2 hover:bg-[#F2AEBB] rounded-lg transition-colors relative">
            <FaPlus size={20} />
            <div className="hidden md:flex">New</div>
          </a> */}

          {/* Notification button with dropdown */}
          <div className="relative mr-3">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex p-1 hover:bg-[#6972c3] rounded-lg transition-colors relative"
            >
              <MdNotifications size={25} />
              {/* Notification badge - แสดงจำนวน unread */}
              {unreadCount > 0 && (
                <span className="absolute -top-0 -right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <NotificationDropdown
              notifications={notifications}
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              isLoading={isLoading}
              currentUser={user}
            />
          </div>

          {/* User Profile - pass user data */}
          <UserMenu user={user} onUserUpdate={setUser} />
        </div>
      </div>
    </nav>
  );
}
