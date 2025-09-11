'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

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
  project?: {
    id: number;
    project_name: string;
  };
}

interface ProjectMember {
  id: number;
  user_id_in_project: number;
  role_in_project: string;
  userInfo?: User;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // อัพเดทเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลผู้ใช้
        const userResponse = await axios.get('/api/auth/me');
        if (userResponse.data.user) {
          setUser(userResponse.data.user);
          
          // ดึงข้อมูล tasks ทั้งหมดของผู้ใช้
          const tasksResponse = await axios.get(`/api/tasks/user/${userResponse.data.user.id}`);
          
          if (tasksResponse.data.success && tasksResponse.data.tasks) {
            // เรียง tasks ตามวันที่ครบกำหนด (ใกล้ถึงก่อน)
            const sortedTasks = tasksResponse.data.tasks.sort((a: Task, b: Task) => {
              const dateA = new Date(a.due_date).getTime();
              const dateB = new Date(b.due_date).getTime();
              return dateA - dateB;
            });
            setTasks(sortedTasks);
          } else {
            setTasks([]);
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

  // ฟังก์ชันจัดรูปแบบวันที่และเวลา
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // ใช้รูปแบบ 24 ชั่วโมง
    });
  };

  // ฟังก์ชันคำนวณจำนวนวันที่เหลือ
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffTime = due.getTime() - currentTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), status: 'overdue', text: `เลยมา ${Math.abs(diffDays)} วัน`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { days: 0, status: 'today', text: 'วันนี้', color: 'text-orange-600' };
    } else if (diffDays <= 3) {
      return { days: diffDays, status: 'urgent', text: `เหลือ ${diffDays} วัน`, color: 'text-red-500' };
    } else if (diffDays <= 7) {
      return { days: diffDays, status: 'soon', text: `เหลือ ${diffDays} วัน`, color: 'text-yellow-600' };
    } else {
      return { days: diffDays, status: 'normal', text: `เหลือ ${diffDays} วัน`, color: 'text-green-600' };
    }
  };

  // ฟังก์ชันคำนวณเวลานับถอยหลังแบบละเอียด
  const getDetailedCountdown = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffTime = due.getTime() - currentTime.getTime();
    
    if (diffTime <= 0) {
      const overdueDiff = Math.abs(diffTime);
      const overdueDays = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        isOverdue: true,
        text: `เลยมา ${overdueDays}d ${overdueHours}h ${overdueMinutes}m`,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
    
    if (days === 0 && hours === 0 && minutes <= 30) {
      return {
        isOverdue: false,
        text: `${minutes}m ${seconds}s`,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    } else if (days === 0 && hours <= 2) {
      return {
        isOverdue: false,
        text: `${hours}h ${minutes}m ${seconds}s`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    } else if (days === 0) {
      return {
        isOverdue: false,
        text: `${hours}h ${minutes}m`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else if (days <= 3) {
      return {
        isOverdue: false,
        text: `${days}d ${hours}h ${minutes}m`,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50'
      };
    } else if (days <= 7) {
      return {
        isOverdue: false,
        text: `${days}d ${hours}h`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else {
      return {
        isOverdue: false,
        text: `${days} วัน`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
  };

  // ฟังก์ชันกำหนดสีของสถานะ
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'turn in':
      case 'completed':
        return {
          text: 'เสร็จแล้ว',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          badgeColor: 'bg-green-500'
        };
      case 'not turn in':
      case 'pending':
        return {
          text: 'ยังไม่เสร็จ',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-400'
        };
      case 'overdue':
        return {
          text: 'เลยกำหนด',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          badgeColor: 'bg-red-500'
        };
      default:
        return {
          text: 'ยังไม่เสร็จ',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-400'
        };
    }
  };

  // ฟังก์ชันแสดง task card
  const renderTaskCard = (task: Task) => {
    const statusConfig = getStatusConfig(task.task_status);
    const daysRemaining = getDaysRemaining(task.due_date);
    const countdown = getDetailedCountdown(task.due_date);
    const isCompleted = task.task_status.toLowerCase() === 'turn in';

    return (
      <div 
        key={task.id} 
        className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-300 mb-4 ${
          daysRemaining.status === 'overdue' && !isCompleted ? 'border-red-300 bg-red-50' :
          daysRemaining.status === 'urgent' && !isCompleted ? 'border-orange-300 bg-orange-50' :
          isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-3 leading-tight">
              {task.task_name}
            </h4>
            {task.project ? (
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium mb-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                โปรเจ็กต์: {task.project.project_name}
              </div>
            ) : (
              <div className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium mb-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                ไม่ได้ระบุโปรเจ็กต์
              </div>
            )}
          </div>
          
          {/* Status badge */}
          <div className={`flex items-center space-x-2`}>
            <div className={`w-4 h-4 rounded-full ${statusConfig.badgeColor}`}></div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3">
          {/* Due date and time */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-blue-600 font-medium text-sm">วันที่</span>
              </div>
              <div className="text-gray-800 font-medium">
                {formatDate(task.due_date)}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <span className="text-green-600 font-medium text-sm">เวลา</span>
              </div>
              <div className="text-gray-800 font-medium">
                {new Date(task.due_date).toLocaleTimeString('th-TH', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </div>
            </div>
          </div>
          
          {/* Detailed countdown */}
          {!isCompleted && (
            <div className={`text-center py-3 px-4 rounded-lg font-bold text-base ${countdown.bgColor} ${countdown.color} border-2 ${
              countdown.isOverdue ? 'border-red-200' : 'border-orange-200'
            }`}>
              <div className="text-sm font-medium mb-1 opacity-75">
                {countdown.isOverdue ? 'เลยกำหนดมาแล้ว' : 'เหลือเวลาอีก'}
              </div>
              <div className="text-lg font-bold">
                {countdown.text}
              </div>
            </div>
          )}
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
          <p className="text-gray-600">กำลังโหลด Dashboard...</p>
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
            <a 
              href="/login" 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </div>
    );
  }

  // สถิติสรุป
  const completedTasks = tasks.filter(task => task.task_status.toLowerCase() === 'turn in');
  const pendingTasks = tasks.filter(task => task.task_status.toLowerCase() !== 'turn in');
  const overdueTasks = tasks.filter(task => {
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'overdue' && task.task_status.toLowerCase() !== 'turn in';
  });
  const urgentTasks = tasks.filter(task => {
    const remaining = getDaysRemaining(task.due_date);
    return (remaining.status === 'urgent' || remaining.status === 'today') && task.task_status.toLowerCase() !== 'turn in';
  });
  
  // แบ่งงานเป็น 3 กลุ่มใหม่
  const urgentAndTodayTasks = tasks.filter(task => {
    if (task.task_status.toLowerCase() === 'turn in') return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'urgent' || remaining.status === 'today';
  });
  
  const normalTasks = tasks.filter(task => {
    if (task.task_status.toLowerCase() === 'turn in') return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'normal' || remaining.status === 'soon';
  });
  
  const overdueTasksOnly = tasks.filter(task => {
    if (task.task_status.toLowerCase() === 'turn in') return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'overdue';
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar user={user} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              สวัสดี {user?.username}! นี่คือภาพรวมงานทั้งหมดของคุณ
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Total Tasks */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">งานทั้งหมด</h3>
                  <p className="text-4xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">เสร็จแล้ว</h3>
                  <p className="text-4xl font-bold text-green-600">{completedTasks.length}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Urgent Tasks */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">ใกล้กำหนด</h3>
                  <p className="text-4xl font-bold text-orange-600">{urgentAndTodayTasks.length}</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-orange-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">เลยกำหนด</h3>
                  <p className="text-4xl font-bold text-red-600">{overdueTasksOnly.length}</p>
                </div>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Columns Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* งานที่ใกล้ถึงกำหนด */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-orange-600 mb-6 flex items-center">
                งานที่ใกล้ถึงกำหนด ({urgentAndTodayTasks.length} งาน)
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {urgentAndTodayTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">ไม่มีงานเร่งด่วน</p>
                  </div>
                ) : (
                  urgentAndTodayTasks.map(task => renderTaskCard(task))
                )}
              </div>
            </div>

            {/* งานที่ยังมีเวลา */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                งานที่ยังมีเวลา ({normalTasks.length} งาน)
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {normalTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">ไม่มีงานในช่วงนี้</p>
                  </div>
                ) : (
                  normalTasks.map(task => renderTaskCard(task))
                )}
              </div>
            </div>

            {/* งานที่เลยกำหนด */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
                งานที่เลยกำหนด ({overdueTasksOnly.length} งาน)
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {overdueTasksOnly.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">ไม่มีงานค้างชำระ</p>
                  </div>
                ) : (
                  overdueTasksOnly.map(task => renderTaskCard(task))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
