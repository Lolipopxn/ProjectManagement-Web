'use client';

import React, { useState, useEffect } from 'react';
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

// Interface สำหรับ task data จาก Strapi
interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: string;
  due_date: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: any;
  attributes?: any;
}

// Interface สำหรับ project member จาก Strapi
interface ProjectMember {
  id: number;
  documentId?: string;
  role_in_project: string;
  join_date: string;
  project_id_number: number;
  user_id_in_project: number;
  project_document_id: string;
  user_ids?: any;
  // สำหรับข้อมูลผู้ใช้ที่ถูก populate
  userInfo?: {
    id: number;
    username: string;
    email?: string;
  };
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
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);

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

        // ดึงข้อมูล project members จริงจาก API
        try {
          setMembersLoading(true);
          const membersResponse = await axios.get(`/api/project-members?projectDocumentId=${projectId}&projectIdNumber=${projectResponse.data.project?.id}`);
          if (membersResponse.data.success && membersResponse.data.projectMembers) {
            console.log('Project members data:', membersResponse.data.projectMembers);
            
            // แปลงข้อมูลและดึงข้อมูล user สำหรับแต่ละ member
            const membersWithUserInfo = await Promise.all(
              membersResponse.data.projectMembers.map(async (member: any) => {
                try {
                  // ดึงข้อมูล user สำหรับแต่ละ member
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
                  console.error(`Error fetching user ${member.user_id_in_project}:`, userError);
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
            
            // ตรวจสอบบทบาทของผู้ใช้หลังจากโหลดข้อมูล project members
            if (currentUser && projectResponse.data.project) {
              const currentUserId = currentUser.id;
              const project = projectResponse.data.project;
              
              console.log('Checking user role:', {
                currentUserId,
                projectCreatedBy: project.created_by_user_id,
                projectCreatedBy2: project.created_by_user
              });
              
              // ตรวจสอบว่าผู้ใช้เป็นผู้สร้างโปรเจ็กต์หรือไม่
              const isProjectCreator = project.created_by_user_id === currentUserId || 
                                     project.created_by_user === currentUserId;
              
              console.log('Is project creator:', isProjectCreator);
              
              if (isProjectCreator) {
                console.log('Setting user role to Leader');
                setUserRole('Leader');
              } else {
                // หาบทบาทจาก project members
                const userMembership = membersWithUserInfo.find(member => 
                  (member.userInfo?.id || member.user_id_in_project) === currentUserId
                );
                
                console.log('User membership found:', userMembership);
                
                if (userMembership) {
                  setUserRole(userMembership.role_in_project);
                } else {
                  setUserRole('Member'); // default role
                }
              }
            }
          } else {
            console.log('No project members found, using empty array');
            setProjectMembers([]);
            
            // ตรวจสอบบทบาทเมื่อไม่มี project members
            if (currentUser && projectResponse.data.project) {
              const currentUserId = currentUser.id;
              const project = projectResponse.data.project;
              
              console.log('Checking user role (no members):', {
                currentUserId,
                projectCreatedBy: project.created_by_user_id,
                projectCreatedBy2: project.created_by_user
              });
              
              // ตรวจสอบว่าผู้ใช้เป็นผู้สร้างโปรเจ็กต์หรือไม่
              const isProjectCreator = project.created_by_user_id === currentUserId || 
                                     project.created_by_user === currentUserId;
              
              console.log('Is project creator (no members):', isProjectCreator);
              
              if (isProjectCreator) {
                console.log('Setting user role to Leader (no members)');
                setUserRole('Leader');
              } else {
                setUserRole('Member'); // default role
              }
            }
          }
        } catch (membersError) {
          console.error('Could not fetch project members:', membersError);
          setProjectMembers([]);
        } finally {
          setMembersLoading(false);
        }

        // ดึงข้อมูล tasks จาก Strapi
        try {
          const tasksResponse = await axios.get(`/api/tasks?projectDocumentId=${projectId}`);
          if (tasksResponse.data.success && tasksResponse.data.tasks) {
            console.log('Tasks data:', tasksResponse.data.tasks);
            
            // แยก tasks ตาม assigned user
            const allTasks = tasksResponse.data.tasks;
            const currentUserId = currentUser?.id;
            
            if (currentUserId) {
              const userTasks = allTasks.filter((task: Task) => 
                task.assigned_to_user_ids_number === currentUserId
              );
              const otherUserTasks = allTasks.filter((task: Task) => 
                task.assigned_to_user_ids_number !== currentUserId
              );
              
              console.log(`Found ${userTasks.length} tasks for current user (${currentUserId})`);
              console.log(`Found ${otherUserTasks.length} tasks for other users`);
              
              setMyTasks(userTasks);
              setOtherTasks(otherUserTasks);
            } else {
              // ถ้าไม่มี user ให้แสดงทั้งหมดในส่วน other tasks
              setOtherTasks(allTasks);
              setMyTasks([]);
            }
          } else {
            console.log('No tasks found or API error');
            setMyTasks([]);
            setOtherTasks([]);
          }
        } catch (tasksError) {
          console.error('Could not fetch tasks:', tasksError);
          // ใช้ mock data ถ้าดึงข้อมูลไม่ได้
          setMyTasks([]);
          setOtherTasks([]);
        }

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

  // Create task function
  const handleCreateTask = async (taskData: any) => {
    try {
      setCreateTaskLoading(true);
      
      const response = await axios.post('/api/tasks/create', {
        task_name: taskData.taskName,
        description: taskData.description,
        due_date: taskData.dueDate,
        project_document_id: projectId,
        project_id_number: project?.id,
        assigned_to_user_ids_number: taskData.assignedUserId,
        task_status: 'not turn in'
      });

      if (response.data.success) {
        // Refresh tasks data
        const tasksResponse = await axios.get(`/api/tasks?projectDocumentId=${projectId}`);
        if (tasksResponse.data.success && tasksResponse.data.tasks) {
          const allTasks = tasksResponse.data.tasks;
          const currentUserId = user?.id;
          
          if (currentUserId) {
            const userTasks = allTasks.filter((task: Task) => 
              task.assigned_to_user_ids_number === currentUserId
            );
            const otherUserTasks = allTasks.filter((task: Task) => 
              task.assigned_to_user_ids_number !== currentUserId
            );
            
            setMyTasks(userTasks);
            setOtherTasks(otherUserTasks);
          }
        }
        
        setShowCreateTaskModal(false);
        alert('Task created successfully!');
      } else {
        alert('Error creating task: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert('Error creating task: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreateTaskLoading(false);
    }
  };

  // Function to refresh project members data
  const refreshProjectMembers = async () => {
    if (!project?.id) return;
    
    try {
      setMembersLoading(true);
      const membersResponse = await axios.get(`/api/project-members?projectDocumentId=${projectId}&projectIdNumber=${project.id}`);
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
        
        // ตรวจสอบบทบาทของผู้ใช้หลังจาก refresh
        if (user && project) {
          const currentUserId = user.id;
          
          // ตรวจสอบว่าผู้ใช้เป็นผู้สร้างโปรเจ็กต์หรือไม่
          const isProjectCreator = project.created_by_user_id === currentUserId || 
                                 project.created_by_user === currentUserId;
          
          if (isProjectCreator) {
            setUserRole('Leader');
          } else {
            // หาบทบาทจาก project members
            const userMembership = membersWithUserInfo.find(member => 
              (member.userInfo?.id || member.user_id_in_project) === currentUserId
            );
            
            if (userMembership) {
              setUserRole(userMembership.role_in_project);
            } else {
              setUserRole('Member'); // default role
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing project members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  // Add member function
  const handleAddMember = async (memberData: any) => {
    try {
      setAddMemberLoading(true);
      
      const response = await axios.post('/api/project-members', {
        project_document_id: projectId,
        project_id_number: project?.id,
        user_id_in_project: memberData.userId,
        role_in_project: memberData.role
      });

      if (response.data.success) {
        await refreshProjectMembers();
        setShowAddMemberModal(false);
        alert('Member added successfully!');
      } else {
        alert('Error adding member: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert('Error adding member: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Remove member function
  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/project-members?memberId=${memberId}`);
      
      if (response.data.success) {
        await refreshProjectMembers();
        alert('Member removed successfully!');
      } else {
        alert('Error removing member: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert('Error removing member: ' + (error.response?.data?.message || error.message));
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

  // Get status config for tasks
  const getTaskStatusConfig = (status: string) => {
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
      case 'overdue':
        return {
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          statusText: 'เลยกำหนด',
          statusBg: 'bg-red-100 text-red-700'
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
    const statusConfig = getTaskStatusConfig(task.task_status);

    // หาข้อมูลผู้รับผิดชอบ
    const assignedMember = projectMembers.find(member => 
      (member.userInfo?.id || member.user_id_in_project) === task.assigned_to_user_ids_number
    );

    const getAssigneeInfo = () => {
      if (!task.assigned_to_user_ids_number) {
        return {
          name: 'ไม่ได้มอบหมาย',
          role: ''
        };
      }

      if (assignedMember) {
        return {
          name: assignedMember.userInfo?.username || `User ${assignedMember.user_id_in_project}`,
          role: assignedMember.role_in_project
        };
      } else {
        return {
          name: `User ${task.assigned_to_user_ids_number}`,
          role: 'Member'
        };
      }
    };

    const assigneeInfo = getAssigneeInfo();
    
    // Simple status configuration
    const cardBg = task.task_status.toLowerCase() === 'turn in' 
      ? 'bg-green-50' 
      : 'bg-white';
    const borderColor = task.task_status.toLowerCase() === 'turn in'
      ? 'border-green-200'
      : 'border-gray-200';
    const isCompleted = task.task_status.toLowerCase() === 'turn in';

    return (
      <div 
        key={task.id} 
        className={`${cardBg} ${borderColor} border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow duration-200`}
      >
        {/* Task Name */}
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 text-lg">
            {task.task_name}
          </h4>
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm">
          {/* Assignee and Due Date Row */}
          <div className="flex justify-between items-center">
            <div className="text-gray-700">
              <span className="font-medium">ผู้รับผิดชอบงาน:</span> {assigneeInfo.name}
            </div>
            <div className="text-gray-600">
              <span className="font-medium">ระยะเวลางาน</span> {formatDate(task.due_date)}
            </div>
          </div>
          
          {/* Status Row */}
          <div className="flex justify-between items-center">
            <div className="text-gray-700">
              <span className="font-medium">Status</span> {task.task_status}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.statusBg}`}>
              {statusConfig.statusText}
            </div>
          </div>
        </div>
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

  // CreateTask Modal Component
  const CreateTaskModal = () => {
    const [taskName, setTaskName] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedUserId, setAssignedUserId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!taskName.trim()) {
        alert('กรุณากรอกชื่อ Task');
        return;
      }
      
      handleCreateTask({
        taskName: taskName.trim(),
        description: description.trim(),
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        assignedUserId: assignedUserId // ไม่ fallback ให้ user?.id แล้ว ปล่อยว่างได้
      });
    };

    const resetForm = () => {
      setTaskName('');
      setDescription('');
      setDueDate('');
      setAssignedUserId(null);
      setShowCreateTaskModal(false);
    };

    if (!showCreateTaskModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">สร้าง Task ใหม่</h3>
                <p className="text-sm text-gray-500">เพิ่มงานใหม่ให้กับโปรเจ็กต์</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={createTaskLoading}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อ Task <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
                placeholder="ป้อนชื่อ Task ที่ต้องการสร้าง"
                required
                disabled={createTaskLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white resize-none"
                placeholder="อธิบายรายละเอียดของ Task นี้"
                rows={4}
                disabled={createTaskLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  กำหนดส่ง
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
                  disabled={createTaskLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  มอบหมายให้
                </label>
                <div className="relative">
                  <select
                    value={assignedUserId || ''}
                    onChange={(e) => setAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white appearance-none text-sm"
                    disabled={createTaskLoading}
                  >
                    <option value="" className="py-2">ไม่มอบหมายให้ใคร</option>
                    
                    {/* Project Members Options */}
                    {projectMembers.length > 0 && (
                      <>
                        {projectMembers.map((member) => {
                          return (
                            <option 
                              key={member.id} 
                              value={member.userInfo?.id || member.user_id_in_project}
                              className="py-3"
                            >
                              {member.userInfo?.username || `User ${member.user_id_in_project}`} • {member.role_in_project}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Helper text */}
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  สามารถปล่อยว่างได้หากไม่ต้องการมอบหมายให้ใคร
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all"
                disabled={createTaskLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={createTaskLoading}
              >
                {createTaskLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังสร้าง...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>สร้าง Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // AddMember Modal Component
  const AddMemberModal = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const [role, setRole] = useState('Member');
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Load available users when modal opens
    useEffect(() => {
      if (showAddMemberModal) {
        const fetchUsers = async () => {
          try {
            setUsersLoading(true);
            const response = await axios.get('/api/users');
            if (response.data.success && response.data.users) {
              // Filter out users who are already members
              const memberUserIds = projectMembers.map(member => member.user_id_in_project);
              const availableUsers = response.data.users.filter((user: User) => 
                !memberUserIds.includes(user.id)
              );
              setAvailableUsers(availableUsers);
            }
          } catch (error) {
            console.error('Error fetching users:', error);
          } finally {
            setUsersLoading(false);
          }
        };
        fetchUsers();
      }
    }, [showAddMemberModal, projectMembers]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) {
        alert('กรุณาเลือกผู้ใช้');
        return;
      }
      
      handleAddMember({
        userId: userId,
        role: role
      });
    };

    const resetForm = () => {
      setUserId(null);
      setRole('Member');
      setShowAddMemberModal(false);
    };

    const getRoleColor = (role: string) => {
      switch (role.toLowerCase()) {
        case 'leader': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    if (!showAddMemberModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">เพิ่มสมาชิกโปรเจ็กต์</h3>
                <p className="text-sm text-gray-500">เชิญสมาชิกใหม่เข้าร่วมโปรเจ็กต์</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={addMemberLoading}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เลือกผู้ใช้ <span className="text-red-500">*</span>
              </label>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium">กำลังโหลดรายชื่อผู้ใช้...</p>
                    <p className="text-xs text-gray-400">กรุณารอสักครู่</p>
                  </div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-2">ไม่มีผู้ใช้ที่สามารถเพิ่มได้</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      ผู้ใช้ทั้งหมดเป็นสมาชิกของโปรเจ็กต์นี้แล้ว หรืออาจไม่มีผู้ใช้อื่นในระบบ
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={userId || ''}
                      onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-gray-50 focus:bg-white appearance-none text-sm"
                      required
                      disabled={addMemberLoading}
                    >
                      <option value="" className="py-2">เลือกผู้ใช้ที่ต้องการเพิ่ม</option>
                      {availableUsers.map((user) => (
                        <option 
                          key={user.id} 
                          value={user.id}
                          className="py-3"
                        >
                          👤 {user.username} • {user.email}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* User count info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      มีผู้ใช้ที่สามารถเพิ่มได้ {availableUsers.length} คน
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </svg>
                      สมาชิกปัจจุบัน {projectMembers.length} คน
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                เลือกบทบาท
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'Member', label: 'สมาชิก', desc: 'สมาชิกทั่วไป' },
                  { value: 'Leader', label: 'หัวหน้าทีม', desc: 'ควบคุมโปรเจ็กต์' }
                ].map((roleOption) => (
                  <div key={roleOption.value} className="col-span-1">
                    <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                      role === roleOption.value
                        ? getRoleColor(roleOption.value) + ' border-current'
                        : 'border-gray-200 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value={roleOption.value}
                        checked={role === roleOption.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="sr-only"
                        disabled={addMemberLoading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{roleOption.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{roleOption.desc}</p>
                      </div>
                      {role === roleOption.value && (
                        <div className="ml-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all"
                disabled={addMemberLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={addMemberLoading || availableUsers.length === 0}
              >
                {addMemberLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังเพิ่ม...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>เพิ่มสมาชิก</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      userRole === 'Leader' 
                        ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {userRole === 'Leader' ? ' Project Leader' : userRole}
                    </span>
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
                    <button 
                      onClick={() => setShowCreateTaskModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Task</span>
                    </button>
                    
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">สมาชิก</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add</span>
                    </button>
                    <button
                      onClick={refreshProjectMembers}
                      disabled={membersLoading}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh members"
                    >
                      <svg className={`w-4 h-4 text-gray-600 ${membersLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                      {projectMembers.length} คน
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {membersLoading ? (
                    <div className="text-center text-gray-500 py-4">
                      <div className="animate-spin mx-auto w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                      <p className="text-sm">กำลังโหลดข้อมูลสมาชิก...</p>
                    </div>
                  ) : projectMembers.length > 0 ? (
                    projectMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {(member.userInfo?.username || `User ${member.user_id_in_project}`).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {member.userInfo?.username || `User ${member.user_id_in_project}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.role_in_project} • เข้าร่วมเมื่อ {formatDate(member.join_date)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(
                            member.id, 
                            member.userInfo?.username || `User ${member.user_id_in_project}`
                          )}
                          className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-colors"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p>ไม่พบสมาชิกในโปรเจ็กต์นี้</p>
                      <p className="text-sm">หรือกำลังโหลดข้อมูล...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal />

      {/* Add Member Modal */}
      <AddMemberModal />
    </div>
  );
}