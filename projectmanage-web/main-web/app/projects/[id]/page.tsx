'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

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
  created_by_user_info?: any;
}

// Interface สำหรับ task data
interface Task {
  id: number;
  task_name: string;
  description: string;
  status: string;
  due_date: string;
  assigned_user?: any;
  priority?: string;
}

// Interface สำหรับ project member
interface ProjectMember {
  id: number;
  user: {
    id: number;
    username: string;
    email?: string;
  };
  role: string;
}

// Interface สำหรับ user data
interface User {
  id: number;
  username: string;
  email: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Member');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลโปรเจ็กต์
        const projectResponse = await axios.get(`/api/projects/${projectId}`);
        
        if (projectResponse.data.success && projectResponse.data.project) {
          setProject(projectResponse.data.project);
        } else {
          setError('ไม่พบข้อมูลโปรเจ็กต์');
        }

        // ดึงข้อมูลผู้ใช้
        try {
          const userResponse = await axios.get('/api/auth/me');
          if (userResponse.data.user) {
            setUser(userResponse.data.user);
          }
        } catch (userError) {
          console.log('Could not fetch user data:', userError);
        }

        // TODO: ดึงข้อมูล tasks และ members จาก API
        // ลองดึงข้อมูล project members ด้วย document ID
        try {
          const membersResponse = await axios.get(`/api/project-members?projectDocumentId=${projectId}`);
          if (membersResponse.data.success && membersResponse.data.projectMembers) {
            console.log('Project members data:', membersResponse.data.projectMembers);
            // TODO: แปลงข้อมูลให้ตรงกับ interface ProjectMember
          }
        } catch (membersError) {
          console.error('Could not fetch project members:', membersError);
        }

        // Mock data สำหรับการทดสอบ
        setMyTasks([
          {
            id: 1,
            task_name: 'ชื่อ Task',
            description: 'ผู้รับผิดชอบงาน: นาย John Doe',
            status: 'Not Turn In',
            due_date: '2024-12-31',
            priority: 'high'
          },
          {
            id: 2,
            task_name: 'ชื่อ Task',
            description: 'ผู้รับผิดชอบงาน: นาย John Doe',
            status: 'Turn In',
            due_date: '2024-12-25',
            priority: 'medium'
          }
        ]);

        setOtherTasks([
          {
            id: 3,
            task_name: 'ชื่อ Task',
            description: 'ผู้รับผิดชอบงาน: นาย Elon muck',
            status: 'Not Turn In',
            due_date: '2024-12-20'
          },
          {
            id: 4,
            task_name: 'ชื่อ Task',
            description: 'ผู้รับผิดชอบงาน: นาย Elon muck',
            status: 'Turn In',
            due_date: '2024-12-15',
            priority: 'overdue'
          }
        ]);

        setProjectMembers([
          { id: 1, user: { id: 1, username: 'Elon Muck', email: 'elon@example.com' }, role: 'Leader' },
          { id: 2, user: { id: 2, username: 'John Doe', email: 'john@example.com' }, role: 'Developer' },
          { id: 3, user: { id: 3, username: 'Jett revice me', email: 'jett@example.com' }, role: 'Designer' },
          { id: 4, user: { id: 4, username: 'Rayna Makemeflash', email: 'rayna@example.com' }, role: 'Tester' },
          { id: 5, user: { id: 5, username: 'Brim Stone', email: 'brim@example.com' }, role: 'Member' }
        ]);

      } catch (error: any) {
        console.error('Error fetching project:', error);
        
        if (error.response?.status === 404) {
          setError('ไม่พบโปรเจ็กต์ที่ระบุ');
        } else if (error.response?.status === 403) {
          setError('คุณไม่มีสิทธิ์เข้าถึงโปรเจ็กต์นี้');
        } else if (error.response?.status === 401) {
          setError('กรุณาเข้าสู่ระบบ');
        } else {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Get status config for tasks
  const getTaskStatusConfig = (status: string, priority?: string) => {
    if (priority === 'overdue') {
      return {
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        statusText: 'เลยกำหนด',
        statusBg: 'bg-red-100 text-red-700'
      };
    }
    
    switch (status.toLowerCase()) {
      case 'turn in':
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200', 
          textColor: 'text-green-800',
          statusText: 'Confirm',
          statusBg: 'bg-green-100 text-green-700'
        };
      case 'not turn in':
      case 'pending':
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800', 
          statusText: 'unConfirm',
          statusBg: 'bg-gray-100 text-gray-700'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          statusText: 'unConfirm',
          statusBg: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // Render Task Card
  const renderTaskCard = (task: Task, isMyTask: boolean = false) => {
    const statusConfig = getTaskStatusConfig(task.status, task.priority);
    const progressPercentage = task.status.toLowerCase() === 'turn in' ? 100 : 20;

    return (
      <div 
        key={task.id} 
        className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-4 mb-3`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{task.task_name}</h4>
            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
            <div className="flex items-center space-x-3">
              <span className="text-gray-700 font-medium">Status</span>
              <span className={`text-${task.status.toLowerCase() === 'turn in' ? 'green' : 'red'}-600 font-medium`}>
                {task.status}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">
              ระยะเวลางาน {formatDate(task.due_date)}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.statusBg}`}>
              {statusConfig.statusText}
            </div>
            {task.priority === 'overdue' && (
              <div className="text-red-600 text-sm font-medium mt-1">
                เลยกำหนด 2 วัน
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar for my tasks */}
        {isMyTask && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>ความคืบหน้า</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${task.status.toLowerCase() === 'turn in' ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลโปรเจ็กต์...</p>
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
          <p className="text-gray-600 mb-6">กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ลองใหม่
            </button>
            <a 
              href="/overview" 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              กลับสู่หน้าหลัก
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบโปรเจ็กต์</h2>
          <p className="text-gray-600 mb-6">โปรเจ็กต์ที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
          <a 
            href="/overview" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  const statusConfig = getTaskStatusConfig(project.project_status || 'pending');

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
            <span className="text-gray-900 font-medium">{project.project_name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tasks */}
            <div className="lg:col-span-2">
              {/* Project Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    ชื่อ {project.project_name} 
                    <span className="text-green-600 ml-2">({userRole})</span>
                  </h1>
                  <div className="flex items-center space-x-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.474L3 21l2.474-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                      </svg>
                      <span>Chat</span>
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                      More Info
                    </button>
                  </div>
                </div>
              </div>

              {/* My Task Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Task</h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">20%</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {myTasks.map(task => renderTaskCard(task, true))}
                </div>
              </div>

              {/* Others Member Task Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Others Member Task</h2>
                <div className="space-y-3">
                  {otherTasks.map(task => renderTaskCard(task, false))}
                </div>
              </div>
            </div>

            {/* Right Column - Gantt Chart & Members */}
            <div className="space-y-6">
              {/* Gantt Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gantt Chart</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Mock Gantt Chart */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="font-medium">Task</span>
                      <span className="font-medium">Timeline</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="w-20 text-xs">Planning</span>
                      <div className="flex-1 bg-gray-200 rounded h-4 relative">
                        <div className="bg-pink-400 h-4 rounded" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="w-20 text-xs">Development</span>
                      <div className="flex-1 bg-gray-200 rounded h-4 relative">
                        <div className="bg-blue-400 h-4 rounded" style={{ width: '60%', marginLeft: '30%' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="w-20 text-xs">Testing</span>
                      <div className="flex-1 bg-gray-200 rounded h-4 relative">
                        <div className="bg-purple-400 h-4 rounded" style={{ width: '40%', marginLeft: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">สมาชิก</h3>
                <div className="space-y-3">
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {member.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {member.role === 'Leader' ? 'นาย' : 'นาง'} {member.user.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}