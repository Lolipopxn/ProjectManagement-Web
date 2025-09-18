'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../../components/Navbar';
import Sidebar from '../../../../components/Sidebar';

// Interface สำหรับ task data
interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description?: string;
  task_status: string;
  due_date: string;
  project_document_id: string;
  project_id_number: number;
  assigned_to_user_ids_number?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface สำหรับ project data
interface Project {
  id: number;
  documentId?: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any;
  created_by_user: number;
  slug: string;
}

// Interface สำหรับ user data
interface User {
  id: number;
  username: string;
  email: string;
}

// Interface สำหรับ project member
interface ProjectMember {
  id: number;
  role_in_project: string;
  join_date: string;
  user_id_in_project: number;
  userInfo?: {
    id: number;
    username: string;
    email?: string;
  };
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const taskDocumentId = params?.taskDocumentId as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลผู้ใช้ปัจจุบัน
        let currentUser = null;
        try {
          const userResponse = await axios.get('/api/auth/me');
          if (userResponse.data.user) {
            setUser(userResponse.data.user);
            currentUser = userResponse.data.user;
          }
        } catch (userError) {
          console.log('Could not fetch user data:', userError);
        }

        // ดึงข้อมูล Task
        const taskResponse = await axios.get(`/api/tasks?projectDocumentId=${projectId}`);
        if (taskResponse.data.success && taskResponse.data.tasks) {
          const foundTask = taskResponse.data.tasks.find((t: Task) => t.documentId === taskDocumentId);
          
          if (foundTask) {
            setTask(foundTask);
            
            // ดึงข้อมูล assigned user ถ้ามี
            if (foundTask.assigned_to_user_ids_number) {
              try {
                const assignedUserResponse = await axios.get(`/api/users?userId=${foundTask.assigned_to_user_ids_number}`);
                if (assignedUserResponse.data.user) {
                  setAssignedUser(assignedUserResponse.data.user);
                }
              } catch (assignedUserError) {
                console.log('Could not fetch assigned user data:', assignedUserError);
              }
            }
          } else {
            setError('ไม่พบ Task ที่ระบุ');
          }
        } else {
          setError('ไม่สามารถดึงข้อมูล Tasks ได้');
        }

        // ดึงข้อมูลโปรเจ็กต์
        const projectResponse = await axios.get(`/api/projects/${projectId}`);
        if (projectResponse.data.success && projectResponse.data.project) {
          setProject(projectResponse.data.project);
        } else {
          setError('ไม่พบข้อมูลโปรเจ็กต์');
        }

        // ดึงข้อมูล project members
        try {
          const membersResponse = await axios.get(`/api/project-members?projectDocumentId=${projectId}`);
          if (membersResponse.data.success && membersResponse.data.projectMembers) {
            const membersWithUserInfo = await Promise.all(
              membersResponse.data.projectMembers.map(async (member: any) => {
                try {
                  const userResponse = await axios.get(`/api/users?userId=${member.user_id_in_project}`);
                  return {
                    ...member,
                    userInfo: userResponse.data.user || {
                      id: member.user_id_in_project,
                      username: `User ${member.user_id_in_project}`,
                      email: ''
                    }
                  };
                } catch (userError) {
                  return {
                    ...member,
                    userInfo: {
                      id: member.user_id_in_project,
                      username: `User ${member.user_id_in_project}`,
                      email: ''
                    }
                  };
                }
              })
            );
            setProjectMembers(membersWithUserInfo);
          }
        } catch (membersError) {
          console.error('Could not fetch project members:', membersError);
        }

      } catch (error: any) {
        console.error('Error fetching task:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && taskDocumentId) {
      fetchTaskData();
    }
  }, [projectId, taskDocumentId]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!task?.documentId) return;
    
    try {
      setUpdating(true);
      
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_status: newStatus
      });

      if (response.data.success) {
        setTask(prev => prev ? { ...prev, task_status: newStatus } : null);
        alert('อัปเดตสถานะเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setUpdating(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'turn in':
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          statusText: 'เสร็จสิ้น'
        };
      case 'not turn in':
      case 'pending':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          statusText: 'รอดำเนินการ'
        };
      case 'overdue':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          statusText: 'เลยกำหนด'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          statusText: 'ไม่ระบุ'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล Task...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ลองใหม่
            </button>
            <button 
              onClick={() => router.push(`/projects/${projectId}`)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              กลับสู่โปรเจ็กต์
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Task not found
  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบ Task</h2>
          <p className="text-gray-600 mb-6">Task ที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
          <button 
            onClick={() => router.push(`/projects/${projectId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            กลับสู่โปรเจ็กต์
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.task_status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar user={user} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-gray-600 mb-6">
            <a href="/overview" className="hover:text-blue-600">Home</a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <a 
              href={`/projects/${projectId}`} 
              className="hover:text-blue-600"
            >
              {project?.project_name || 'Project'}
            </a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{task.task_name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Task Details */}
            <div className="lg:col-span-2">
              {/* Task Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {task.task_name}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                        {statusConfig.statusText}
                      </div>
                      <span className="text-gray-500 text-sm">
                        สร้างเมื่อ {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียด</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                  </p>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">อัปเดตสถานะ</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleStatusUpdate('not turn in')}
                    disabled={updating || task.task_status === 'not turn in'}
                    className="flex items-center justify-center space-x-2 px-4 py-3 border border-yellow-300 rounded-lg hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-800 font-medium">ยังไม่ส่ง</span>
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('turn in')}
                    disabled={updating || task.task_status === 'turn in'}
                    className="flex items-center justify-center space-x-2 px-4 py-3 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-800 font-medium">ส่งแล้ว</span>
                  </button>
                </div>
                
                {updating && (
                  <div className="flex items-center justify-center mt-4 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm">กำลังอัปเดต...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Task Info */}
            <div className="space-y-6">
              {/* Task Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูล Task</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      ผู้รับผิดชอบ
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {assignedUser ? assignedUser.username.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {assignedUser ? assignedUser.username : 'ไม่ได้กำหนด'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      กำหนดส่ง
                    </label>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-900">{formatDate(task.due_date)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      สถานะปัจจุบัน
                    </label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                      {statusConfig.statusText}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      อัปเดตล่าสุด
                    </label>
                    <span className="text-gray-900">{formatDate(task.updatedAt)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Task ID
                    </label>
                    <span className="text-gray-900 font-mono text-sm">{task.documentId || task.id}</span>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              {project && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลโปรเจ็กต์</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        ชื่อโปรเจ็กต์
                      </label>
                      <a 
                        href={`/projects/${projectId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {project.project_name}
                      </a>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        วันที่เริ่มต้น
                      </label>
                      <span className="text-gray-900">{formatDate(project.start_date)}</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        วันที่สิ้นสุด
                      </label>
                      <span className="text-gray-900">{formatDate(project.end_date)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการ</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push(`/projects/${projectId}`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>กลับสู่โปรเจ็กต์</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>แก้ไข Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
