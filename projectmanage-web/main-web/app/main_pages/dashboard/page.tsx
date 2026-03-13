'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

// Types
interface User {
  id: number;
  username: string;
  email: string;
}

interface Task {
  id: number;
  task_name: string;
  description?: string;
  due_date: string;
  task_status: string;
  project_document_id: string;
  project_id_number: number;
  assigned_to_user_ids_number: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  documentId: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  tasks: Task[];
}

interface ProjectMember {
  id: number;
  documentId: string;
  role: 'owner' | 'admin' | 'member';
  role_in_project: string;
  user_id_in_project: number;
  project_document_id: string;
  project_id_number: number;
}

interface ProjectStats {
  project: Project;
  totalTasks: number;
  overdueTasks: number;
  urgentTasks: number;
  normalTasks: number;
  pendingReviewTasks: number;
  rejectedTasks: number;
  completedTasks: number;
  userRole?: 'owner' | 'admin' | 'member';
  userRoleInProject?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states for each column
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [onHoldCurrentPage, setOnHoldCurrentPage] = useState(1);
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
  const [cancelledCurrentPage, setCancelledCurrentPage] = useState(1);
  const itemsPerPage = 2;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลผู้ใช้
        const userResponse = await axios.get('/api/auth/me');
        if (userResponse.data.user) {
          setUser(userResponse.data.user);
          const currentUserId = userResponse.data.user.id;
          
          // ดึงข้อมูล projects และ tasks
          const projectsResponse = await axios.get(`/api/projects`);
          
          if (projectsResponse.data.success && projectsResponse.data.projects) {
            const projectsData: Project[] = projectsResponse.data.projects;
            setProjects(projectsData);
            
            // ดึงข้อมูล project members ของผู้ใช้คนนี้
            const projectMembersResponse = await axios.get(`/api/project-members?userId=${currentUserId}`);
            const projectMembers: ProjectMember[] = projectMembersResponse.data.projectMembers || [];
            
            // สร้าง map ของ project document id -> member info
            const projectMemberMap = new Map();
            projectMembers.forEach(member => {
              projectMemberMap.set(member.project_document_id, {
                role: member.role,
                roleInProject: member.role_in_project
              });
            });
            
            // ดึงข้อมูล tasks ทั้งหมด
            const tasksResponse = await axios.get('/api/tasks');
            const allTasks: Task[] = tasksResponse.data.tasks || [];
            
            console.log('All tasks:', allTasks.length);
            
            // คำนวณสถิติของแต่ละ project
            const stats = projectsData.map(project => {
              // กรองเฉพาะ tasks ที่เป็นของ project นี้
              const tasks = allTasks.filter(task => 
                task.project_document_id === project.documentId
              );
              const now = new Date().getTime();
              
              // ดึงข้อมูล role ของผู้ใช้ในโปรเจกต์นี้
              const memberInfo = projectMemberMap.get(project.documentId);
              
              console.log(`Project: ${project.project_name} (${project.documentId}), Tasks count: ${tasks.length}`);
              
              const overdue = tasks.filter(task => {
                const isNotSubmitted = ['not turn in', 'pending', 'overdue'].includes(task.task_status.toLowerCase());
                const isPastDue = new Date(task.due_date).getTime() < now;
                return isNotSubmitted && isPastDue;
              });
              
              const urgent = tasks.filter(task => {
                const isNotSubmitted = ['not turn in', 'pending'].includes(task.task_status.toLowerCase());
                const dueDate = new Date(task.due_date).getTime();
                const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                return isNotSubmitted && diffDays >= 0 && diffDays <= 3;
              });
              
              const normal = tasks.filter(task => {
                const isNotSubmitted = ['not turn in', 'pending'].includes(task.task_status.toLowerCase());
                const dueDate = new Date(task.due_date).getTime();
                const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                return isNotSubmitted && diffDays > 3;
              });
              
              const pendingReview = tasks.filter(task => 
                ['pending_review', 'turn in'].includes(task.task_status.toLowerCase())
              );
              
              const rejected = tasks.filter(task => 
                task.task_status.toLowerCase() === 'rejected'
              );
              
              const completed = tasks.filter(task => 
                task.task_status.toLowerCase() === 'completed'
              );
              
              const statsResult = {
                project,
                totalTasks: tasks.length,
                overdueTasks: overdue.length,
                urgentTasks: urgent.length,
                normalTasks: normal.length,
                pendingReviewTasks: pendingReview.length,
                rejectedTasks: rejected.length,
                completedTasks: completed.length,
                userRole: memberInfo?.role,
                userRoleInProject: memberInfo?.roleInProject
              };
              
              console.log(`Stats for ${project.project_name}:`, statsResult);
              
              return statsResult;
            });
            
            setProjectStats(stats);
          } else {
            setProjects([]);
            setProjectStats([]);
          }
        } else {
          setError('กรุณาเข้าสู่ระบบ');
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error.response?.status === 401) {
          setError('กรุณาเข้าสู่ระบบ');
        } else {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ฟังก์ชันจัดรูปแบบวันที่
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // คำนวณสถิติรวมทั้งหมด
  const totalStats = projectStats.reduce((acc, stat) => ({
    totalTasks: acc.totalTasks + stat.totalTasks,
    overdueTasks: acc.overdueTasks + stat.overdueTasks,
    urgentTasks: acc.urgentTasks + stat.urgentTasks,
    normalTasks: acc.normalTasks + stat.normalTasks,
    pendingReviewTasks: acc.pendingReviewTasks + stat.pendingReviewTasks,
    rejectedTasks: acc.rejectedTasks + stat.rejectedTasks,
    completedTasks: acc.completedTasks + stat.completedTasks
  }), {
    totalTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0,
    normalTasks: 0,
    pendingReviewTasks: 0,
    rejectedTasks: 0,
    completedTasks: 0
  });

  // ฟังก์ชันแสดง Project Card (แบบ Simple & Clean)
  const renderProjectCard = (stats: ProjectStats) => {
    const { project } = stats;
    
    // คำนวณ progress percentage
    const progressPercentage = stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
      : 0;

    // กำหนดสีตาม progress
    const getProgressColor = () => {
      if (progressPercentage >= 80) return 'bg-green-500';
      if (progressPercentage >= 50) return 'bg-blue-500';
      if (progressPercentage >= 25) return 'bg-yellow-500';
      return 'bg-orange-500';
    };

    // ฟังก์ชันแสดง role badge
    const getRoleBadge = () => {
      // แสดง role_in_project ถ้ามี (เช่น Designer, Developer, Tester)
      // ใช้สีตาม role: Leader (owner/admin) = สีม่วง, Member = สีฟ้า
      if (stats.userRoleInProject) {
        const isLeader = stats.userRole === 'owner' || stats.userRole === 'admin';
        const badgeColor = isLeader 
          ? 'bg-purple-100 text-purple-700 border-purple-200' 
          : 'bg-blue-100 text-blue-700 border-blue-200';
        
        return (
          <span className={`${badgeColor} border text-[9px] font-semibold px-2 py-0.5 rounded-full`}>
            {stats.userRoleInProject}
          </span>
        );
      }
      
      // ถ้าไม่มี role_in_project ให้แสดง role แทน
      if (stats.userRole) {
        const roleConfig = {
          owner: { label: 'Leader', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
          admin: { label: 'Leader', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
          member: { label: 'Member', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
        };
        
        const config = roleConfig[stats.userRole];
        
        return (
          <span className={`${config.bg} ${config.text} border ${config.border} text-[9px] font-semibold px-2 py-0.5 rounded-full`}>
            {config.label}
          </span>
        );
      }
      
      return null;
    };

    return (
      <Link
        key={project.id}
        href={`/main_pages/projects/${project.documentId || project.id}`}
        className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-400 dark:bg-gray-800 dark:border-gray-400 dark:hover:border-blue-500"
      >
        {/* Project Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1 pr-2 dark:text-gray-300">
              {project.project_name}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getRoleBadge()}
              {stats.overdueTasks > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {stats.overdueTasks}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(project.start_date)}</span>
            <span>-</span>
            <span>{formatDate(project.end_date)}</span>
          </div>
        </div>

        {/* Progress Section - Compact & Clean */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-600 font-medium dark:text-gray-400">ความคืบหน้า</span>
            <span className={`text-xs font-bold ${
              progressPercentage >= 80 ? 'text-green-600' : 
              progressPercentage >= 50 ? 'text-blue-600' : 
              progressPercentage >= 25 ? 'text-yellow-600' : 
              'text-orange-600'
            }`}>
              {progressPercentage}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`${getProgressColor()} h-2 rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Compact Task Info */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-gray-600">
              <span className="font-semibold text-gray-900">{stats.completedTasks}</span>/{stats.totalTasks} งาน
            </span>
            <span className="text-[9px] text-gray-500">
              เหลือ {stats.totalTasks - stats.completedTasks}
            </span>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <div className="text-xl font-bold text-gray-900">{stats.totalTasks}</div>
            <div className="text-[9px] text-gray-600 font-medium mt-0.5">ทั้งหมด</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
            <div className="text-xl font-bold text-green-600">{stats.completedTasks}</div>
            <div className="text-[9px] text-green-700 font-medium mt-0.5">เสร็จแล้ว</div>
          </div>
        </div>
      </Link>
    );
  };

  // จัดกลุ่ม Projects ตาม Status
  const groupedProjects = {
    active: projectStats.filter(stat => stat.project.project_status === 'active'),
    'on-hold': projectStats.filter(stat => stat.project.project_status === 'on-hold'),
    completed: projectStats.filter(stat => stat.project.project_status === 'completed'),
    cancelled: projectStats.filter(stat => stat.project.project_status === 'cancelled'),
  };

  // Pagination helper function
  const paginateProjects = (projects: ProjectStats[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return projects.slice(startIndex, endIndex);
  };

  // Calculate total pages for each column
  const activeTotalPages = Math.ceil(groupedProjects.active.length / itemsPerPage);
  const onHoldTotalPages = Math.ceil(groupedProjects['on-hold'].length / itemsPerPage);
  const completedTotalPages = Math.ceil(groupedProjects.completed.length / itemsPerPage);
  const cancelledTotalPages = Math.ceil(groupedProjects.cancelled.length / itemsPerPage);

  // Render pagination component - Improved UX
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setCurrentPage: (page: number) => void,
    totalItems: number
  ) => {
    // Only show pagination if more than 1 page (more than 2 cards)
    if (totalPages <= 1) {
      return <div className="h-[56px]"></div>; // Spacer to maintain consistent height
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Calculate page numbers to show dynamically
    const getPageNumbers = () => {
      const maxVisible = 3; // Show max 3 page numbers for compact design
      
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      // Always show first, current (if not first or last), and last
      if (currentPage === 1) {
        return [1, 2, 3];
      }
      
      if (currentPage === totalPages) {
        return [totalPages - 2, totalPages - 1, totalPages];
      }
      
      // Show current page in middle
      return [currentPage - 1, currentPage, currentPage + 1];
    };

    const pageNumbers = getPageNumbers();
    const showFirstJump = currentPage > 2;
    const showLastJump = currentPage < totalPages - 1;

    return (
      <div className="pt-3 border-t border-gray-200 h-[56px]">
        {/* Compact Info Badge */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-[9px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full dark:text-gray-200 dark:bg-gray-700">
            {startItem}-{endItem} จาก {totalItems}
          </span>
        </div>
        
        {/* Pagination Controls - Compact & Intuitive */}
        <div className="flex items-center justify-center gap-0.5">
          {/* Previous Button - Always visible */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors text-[10px] font-medium text-gray-700 dark:text-gray-200 dark:hover:bg-gray-600/30"
            aria-label="Previous page"
            title="หน้าก่อนหน้า"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">ก่อน</span>
          </button>
          
          {/* First Page Jump - Show if needed */}
          {showFirstJump && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="w-6 h-6 rounded-md text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-600/30"
                title="หน้าที่ 1"
              >
                1
              </button>
              {currentPage > 3 && (
                <span className="px-1 text-gray-400 text-xs dark:text-gray-200">...</span>
              )}
            </>
          )}
          
          {/* Page Numbers - Dynamic based on position */}
          <div className="flex items-center gap-0.5">
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[24px] h-6 px-2 rounded-md text-[10px] font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm scale-105 dark:bg-blue-500'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600/30'
                }`}
                title={`หน้า ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          {/* Last Page Jump - Show if needed */}
          {showLastJump && (
            <>
              {currentPage < totalPages - 2 && (
                <span className="px-1 text-gray-400 text-xs">...</span>
              )}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="w-6 h-6 rounded-md text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-600/30"
                title={`หน้าที่ ${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}
          
          {/* Next Button - Always visible */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors text-[10px] font-medium text-gray-700 dark:text-gray-200 dark:hover:bg-gray-600/30"
            aria-label="Next page"
            title="หน้าถัดไป"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium dark:text-gray-200">กำลังโหลด Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center dark:from-gray-800 dark:to-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{error}</h2>
          <p className="text-gray-600 mb-8 dark:text-gray-200">กรุณาลองใหม่อีกครั้งหรือเข้าสู่ระบบ</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/30 "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ลองใหม่
            </button>
            <a 
              href="/auth_page/login" 
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-gray-600/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">   
      <div className="flex"> 
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Page Header - Redesigned */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 dark:text-gray-200">
                  Dashboard
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  ภาพรวมโครงการทั้งหมดของคุณ
                </p>
              </div>
              
              {/* Quick Stats Cards */}
              <div className="flex gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium dark:text-gray-200">โครงการ</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{projects.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium dark:text-gray-200">งานทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{totalStats.totalTasks}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {projectStats.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-gray-300">เริ่มต้นสร้างโครงการแรกของคุณ</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto dark:text-gray-200">จัดการงานและติดตามความคืบหน้าได้อย่างมีประสิทธิภาพ</p>
                <Link
                  href="/main_pages/create-project"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  สร้างโครงการใหม่
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Active Projects Column */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300">กำลังดำเนินการ</h3>
                    </div>
                    <span className="text-lg font-bold text-green-600">{groupedProjects.active.length}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between" style={{ minHeight: '520px' }}>
                    <div className="space-y-3">
                      {paginateProjects(groupedProjects.active, activeCurrentPage).map(stats => renderProjectCard(stats))}
                    </div>
                    <div className="mt-auto">
                      {renderPagination(activeCurrentPage, activeTotalPages, setActiveCurrentPage, groupedProjects.active.length)}
                    </div>
                  </div>
                </div>

                {/* On-Hold Projects Column */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300">พักการทำงาน</h3>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{groupedProjects['on-hold'].length}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between" style={{ minHeight: '520px' }}>
                    <div className="space-y-3">
                      {paginateProjects(groupedProjects['on-hold'], onHoldCurrentPage).map(stats => renderProjectCard(stats))}
                    </div>
                    <div className="mt-auto">
                      {renderPagination(onHoldCurrentPage, onHoldTotalPages, setOnHoldCurrentPage, groupedProjects['on-hold'].length)}
                    </div>
                  </div>
                </div>

                {/* Completed Projects Column */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300">เสร็จสิ้น</h3>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{groupedProjects.completed.length}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between" style={{ minHeight: '520px' }}>
                    <div className="space-y-3">
                      {paginateProjects(groupedProjects.completed, completedCurrentPage).map(stats => renderProjectCard(stats))}
                    </div>
                    <div className="mt-auto">
                      {renderPagination(completedCurrentPage, completedTotalPages, setCompletedCurrentPage, groupedProjects.completed.length)}
                    </div>
                  </div>
                </div>

                {/* Cancelled Projects Column */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300">ยกเลิก</h3>
                    </div>
                    <span className="text-lg font-bold text-red-600">{groupedProjects.cancelled.length}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between" style={{ minHeight: '520px' }}>
                    <div className="space-y-3">
                      {paginateProjects(groupedProjects.cancelled, cancelledCurrentPage).map(stats => renderProjectCard(stats))}
                    </div>
                    <div className="mt-auto">
                      {renderPagination(cancelledCurrentPage, cancelledTotalPages, setCancelledCurrentPage, groupedProjects.cancelled.length)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
