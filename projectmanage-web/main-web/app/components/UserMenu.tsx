'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserMenuProps {
  initialUser?: User | null;
}

export default function UserMenu({ initialUser }: UserMenuProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);

  useEffect(() => {
    // ถ้าไม่มี initialUser ให้ดึงข้อมูลจาก client side
    if (!initialUser) {
      const fetchUserData = async () => {
        try {
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];

          if (token) {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_STRAPI_BASE_URL}/api/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            setUser(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };

      fetchUserData();
    }
  }, [initialUser]);

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // เรียก logout API
      const response = await axios.post('/api/auth/logout');
      
      if (response.data.success) {
        console.log('Server logout successful');
      }
      
      // ล้าง token จาก cookies (backup)
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
      
      // ล้าง localStorage และ sessionStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // ล้าง state
      setUser(null);
      
      console.log('Client-side cleanup completed');
      
      // Redirect ไปหน้า login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Error during logout:', error);
      
      // หากเรียก API ไม่สำเร็จก็ยังคงล้างข้อมูล client-side
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
      
      // แม้เกิดข้อผิดพลาดก็ให้ redirect ไปหน้า login
      window.location.href = '/login';
    }
  };

  return (
    <div className="relative group">
      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
        {user ? (
          <span className="text-gray-600 font-semibold text-sm">
            {user.username.charAt(0).toUpperCase()}
          </span>
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {user && (
            <>
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user.username}</div>
                <div className="text-gray-500">{user.email}</div>
              </div>
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                โปรไฟล์
              </a>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                ตั้งค่า
              </a>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                ออกจากระบบ
              </button>
            </>
          )}
          {!user && (
            <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              เข้าสู่ระบบ
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
