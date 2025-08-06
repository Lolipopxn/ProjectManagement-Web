'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProjectCard from '../components/ProjectCard';

// Interface สำหรับ project data
interface Project {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any;
  created_by_user: number;
  created_by_user_info?: any; // ข้อมูลผู้สร้างโปรเจ็กต์
  userRole?: string; // เพิ่มบทบาทของผู้ใช้ในโปรเจ็กต์
}

// Interface สำหรับ user data
interface User {
  id: number;
  username: string;
  email: string;
}

// Interface สำหรับ overview data
interface OverviewData {
  user: User | null;
  projects: Project[];
  userOwnProjects: Project[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
  };
}

// Main Overview Page Component
export default function OverviewPage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลจาก API route
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching overview data from API...');
        const response = await axios.get('/api/overview');
        
        console.log('Overview API response:', response.data);
        console.log('User own projects count:', response.data?.userOwnProjects?.length);
        console.log('User own projects data:', response.data?.userOwnProjects);
        
        setOverviewData(response.data);
      } catch (error: any) {
        console.error('Failed to fetch overview data:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 401) {
          setError('กรุณาเข้าสู่ระบบ');
        } else {
          setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  // แสดง loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดง error state
  if (error || !overviewData?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'กรุณาเข้าสู่ระบบ'}
          </h2>
          <p className="text-gray-600 mb-6">คุณต้องเข้าสู่ระบบเพื่อดูข้อมูลโปรเจ็กต์</p>
          <a 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  const { user, userOwnProjects, stats } = overviewData;

  // ตรวจสอบและแสดงข้อมูลที่ปลอดภัย
  const safeUserProjects = userOwnProjects || [];
  const safeStats = stats || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar user={user} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <span>Project Overview</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <a 
                href="/create-project"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>สร้างโปรเจ็กต์ใหม่</span>
              </a>
            </div>

            
            

            {/* Project Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{safeStats.totalProjects}</div>
                  <div className="text-xs text-gray-600">โปรเจ็กต์ทั้งหมด</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{safeStats.activeProjects}</div>
                  <div className="text-xs text-gray-600">กำลังดำเนินการ</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{safeStats.completedProjects}</div>
                  <div className="text-xs text-gray-600">เสร็จสิ้น</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{safeStats.pendingProjects}</div>
                  <div className="text-xs text-gray-600">รอดำเนินการ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <h2 className="text-xl font-semibold text-blue-700 mb-4">
              โปรเจ็กต์ที่ฉันเป็นสมาชิก
              <span className="text-sm text-gray-500 ml-2">
                ({safeUserProjects.length} โปรเจ็กต์)
              </span>
            </h2>
            <div className="space-y-4">
              {safeUserProjects.length > 0 ? (
                safeUserProjects.map((project: Project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-700 text-lg font-medium mb-2">คุณยังไม่ได้เป็นสมาชิกในโปรเจ็กต์ใดๆ</p>
                  <p className="text-blue-600 text-sm mb-4">สร้างโปรเจ็กต์ใหม่หรือติดต่อเจ้าของโปรเจ็กต์เพื่อขอเข้าร่วม</p>
                  <a 
                    href="/create-project"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>สร้างโปรเจ็กต์ใหม่</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
