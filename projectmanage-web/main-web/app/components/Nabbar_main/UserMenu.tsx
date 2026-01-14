"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

import { MdSpaceDashboard, MdPerson, MdNotifications } from "react-icons/md";
import { FaFolder, FaPlus} from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserMenuProps {
  user: User | null;
  onUserUpdate: (user: User | null) => void;
}

export default function UserMenu({ user, onUserUpdate }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ไม่ต้อง fetch user data เอง เพราะได้รับจาก props แล้ว
  // useEffect สำหรับ fetch user data ถูกลบออก

  // Close on outside click and Esc
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");

      // เรียก logout API
      const response = await axios.post("/api/auth/logout");

      if (response.data.success) {
        console.log("Server logout successful");
      }

      // ล้าง token จาก cookies (backup)
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" +
        window.location.hostname;

      // ล้าง localStorage และ sessionStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // ล้าง state - ใช้ onUserUpdate แทน setUser
      onUserUpdate(null);

      console.log("Client-side cleanup completed");

      // Redirect ไปหน้า login
      window.location.href = "/auth_page/login";
    } catch (error) {
      console.error("Error during logout:", error);

      // หากเรียก API ไม่สำเร็จก็ยังคงล้างข้อมูล client-side
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" +
        window.location.hostname;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      onUserUpdate(null);

      // แม้เกิดข้อผิดพลาดก็ให้ redirect ไปหน้า login
      window.location.href = "/auth_page/login";
    }
  };

  const Avatar = ({ name }: { name?: string }) => (
    <div className="size-5 md:size-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold ring-2 ring-indigo-100">
      {name?.charAt(0)?.toUpperCase() || (
        <svg
          className="size-4 text-white/90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )}
    </div>
  );

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-[white] pl-1 pr-2 py-1 shadow-sm hover:shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        <Avatar name={user?.username} />
        {user && (
          <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[140px] truncate">
            {user.username}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.163l3.71-3.93a.75.75 0 111.08 1.04l-4.24 4.49a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      <div
        role="menu"
        aria-label="User menu"
        className={`absolute right-0 mt-1 w-auto px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-150 origin-top-right${
          open
            ? "opacity-100 scale-100 translate-y-0 visible"
            : "opacity-0 scale-95 -translate-y-1 invisible pointer-events-none"
        }`}
      >
        {user ? (
          <div className="py-2">
            <div className="px-15 md:px-1 pb-3 pt-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex flex-row items-center gap-3">
                <Avatar name={user.username} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {user.username}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <a
              href="/main_pages/profile"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <MdPerson  className="w-5 h-5 text-gray-700" />
              <div>โปรไฟล์</div>
            </a>

            <a
              href="/main_pages/dashboard"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <MdSpaceDashboard className="w-4 h-4 text-gray-700" />
              <div>แดชบอร์ด</div>
            </a>

            <a
              href="/main_pages/overview"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FaFolder className="w-4 h-4 text-gray-700" />
              <div>โปรเจคทั้งหมด</div>
            </a>

            <a
              href="/main_pages/create-project"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FaPlus className="w-4 h-4 text-gray-700" />
              <div>สร้างโปรเจคใหม่</div>
            </a>

            <a
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="flex flex-row justify-center items-center gap-3">
                <MdNotifications className="w-4 h-4 text-gray-700" />
                <div>การเเจ้งเตือน</div>
              </div>
            </a>

            <a
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <IoIosSettings  className="w-4 h-4 text-gray-700" />
              <div>ตั้งค่า</div>
            </a>

            <div className="my-1 h-px bg-gray-100" />

            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <svg
                className="w-5 h-5 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
                />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="px-5">
            <a
              href="/auth_page/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3text-sm text-gray-700 hover:bg-gray-50 w-17"
            >
                เข้าสู่ระบบ
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
