'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectCard from '../../components/ProjectCard';

import { useSidebarStore } from "@/hooks/sidebar";

// Interface สำหรับ project data
interface Project {
  id: number;
  documentId?: string; // Document ID จาก Strapi v5
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
  const isNavOpen = useSidebarStore((s) => s.isNavOpen);
  const [isToggle, setToggle] = useState(true);

  // ดึงข้อมูลจาก API route
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching overview data from API...');
        const response = await axios.get('/api/overview');
        
        // console.log('Overview API response:', response.data);
        // console.log('User own projects count:', response.data?.userOwnProjects?.length);
        // console.log('User own projects data:', response.data?.userOwnProjects);
        
        setOverviewData(response.data);
      } catch (error: any) {
        // console.error('Failed to fetch overview data:', error);
        // console.error('Error response:', error.response?.data);
        
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
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
      <div className="h-auto w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'กรุณาเข้าสู่ระบบ'}
          </h2>
          <p className="text-gray-600 mb-6">คุณต้องเข้าสู่ระบบเพื่อดูข้อมูลโปรเจ็กต์</p>
          <a 
            href="/auth_page/login" 
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
    <div className=" bg-white min-h-screen w-full">
      {/* Navbar */}
      
      <div className="flex flex-row justify-center items-start">
        {/* Main Content */}
        <div className={`flex-1 p-6 max-w-[1900px]`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <span>Project Overview</span>
                <button onClick={() => {setToggle(x => !x)} }>
                  <svg className={`w-4 h-4 ${isToggle ? 'rotate-0' : 'rotate-90'} transition-all duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <a 
                href="/main_pages/create-project"
                className="bg-blue-500 hover:bg-blue-600 shadow-md shadow-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Project</span>
              </a>
            </div>

            {/* Project Stats Cards */}
            {isToggle && (
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
            )}
          </div>

          {/* Projects Section */}
          <div className="space-y-8">
            {/* Projects as Leader Section */}
            <div>
              <div className="flex flex-col justify-start items-start mb-6 gap-2">
                <div className="flex flex-row justify-between items-center w-full">           
                  <div className='flex flex-row items-center justify-start w-full gap-3'>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900">โปรเจกต์ที่เป็นเจ้าของ</h2>
                      <p className="text-gray-600 text-sm md:text-[16px]">โปรเจกต์ที่คุณเป็นผู้สร้างและดูแล</p>    
                    </div>
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium md:w-25 text-center">
                    {safeUserProjects.filter(project => 
                      project.created_by_user_id === user?.id || project.created_by_user === user?.id
                    ).length} <div className='hidden md:inline'>โปรเจกต์</div>
                  </div>
                </div>       
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {safeUserProjects
                  .filter(project => 
                    project.created_by_user_id === user?.id || project.created_by_user === user?.id
                  )
                  .map((project: Project) => (
                    <a 
                      key={project.id} 
                      href={`/main_pages/projects/${project.documentId || project.id}`}
                      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-6 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span>Leader</span>
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          project.project_status === 'active' 
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : project.project_status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {project.project_status === 'active' ? 'กำลังดำเนินการ' :
                           project.project_status === 'completed' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.project_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(project.start_date).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(project.end_date).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                
                {/* Empty state for Leader projects */}
                {safeUserProjects.filter(project => 
                  project.created_by_user_id === user?.id || project.created_by_user === user?.id
                ).length === 0 && (
                  <div className="col-span-full">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 text-lg font-semibold mb-2">ยังไม่มีโปรเจกต์ที่เป็น Leader</p>
                      <p className="text-gray-500 text-sm mb-4">สร้างโปรเจกต์ใหม่เพื่อเริ่มเป็นผู้นำทีม</p>
                      <a 
                        href="/main_pages/create-project"
                        className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 shadow-md shadow-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>สร้างโปรเจกต์ใหม่</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Projects as Member Section */}
            <div>
              <div className="flex flex-col justify-start items-start mb-6 gap-2">
                <div className="flex flex-row justify-between items-center w-full">           
                  <div className='flex flex-row items-center justify-start w-full gap-3'>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900">โปรเจกต์ที่เป็นสมาชิก</h2>
                      <p className="text-gray-600 text-sm md:text-[16px]">โปรเจกต์ที่คุณเข้าร่วมในฐานะสมาชิก</p>    
                    </div>
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium md:w-25">
                    {safeUserProjects.filter(project => 
                      project.created_by_user_id !== user?.id && project.created_by_user !== user?.id
                    ).length} <div className='hidden md:inline'>โปรเจกต์</div>
                  </div>
                </div>       
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {safeUserProjects
                  .filter(project => 
                    project.created_by_user_id !== user?.id && project.created_by_user !== user?.id
                  )
                  .map((project: Project) => (
                    <a 
                      key={project.id} 
                      href={`/main_pages/projects/${project.documentId || project.id}`}
                      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-6 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Member</span>
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          project.project_status === 'active' 
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : project.project_status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {project.project_status === 'active' ? 'กำลังดำเนินการ' :
                           project.project_status === 'completed' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.project_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(project.start_date).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(project.end_date).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                
                {/* Empty state for Member projects */}
                {safeUserProjects.filter(project => 
                  project.created_by_user_id !== user?.id && project.created_by_user !== user?.id
                ).length === 0 && (
                  <div className="col-span-full">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 text-lg font-semibold mb-2">ยังไม่เป็นสมาชิกในโปรเจกต์ใด</p>
                      <p className="text-gray-500 text-sm mb-4">รอการเชิญจาก Leader หรือติดต่อเพื่อขอเข้าร่วมโปรเจกต์</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Empty state for all projects */}
            {safeUserProjects.length === 0 && (
              null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
