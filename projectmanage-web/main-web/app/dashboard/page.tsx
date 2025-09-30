'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TaskStatusIcon from '../components/TaskStatusIcon';

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
      const overdueSeconds = Math.floor((overdueDiff % (1000 * 60)) / 1000);
      
      return {
        isOverdue: true,
        text: `${overdueDays}d ${overdueHours}h ${overdueMinutes}m ${overdueSeconds}s`,
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
        text: `${hours}h ${minutes}m ${seconds}s`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else if (days <= 3) {
      return {
        isOverdue: false,
        text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50'
      };
    } else if (days <= 7) {
      return {
        isOverdue: false,
        text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else {
      return {
        isOverdue: false,
        text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
  };

  // Import color utility
  const { getTaskStatusConfig } = require('../utils/taskStatusColors');
  
  // ฟังก์ชันกำหนดสีของสถานะ - ใช้ utility function
  const getStatusConfig = (status: string) => {
    const config = getTaskStatusConfig(status);
    return {
      text: config.text,
      bgColor: config.lightBgColor,
      textColor: config.textColor,
      badgeColor: config.badgeColor
    };
  };

  // ฟังก์ชันแสดง task card แบบกระชับ พร้อมสีตามประเภทคอลัมน์
  const renderCompactTaskCard = (task: Task, columnType: 'overdue' | 'urgent' | 'normal' | 'pending_review' | 'rejected' | 'completed') => {
    const statusConfig = getStatusConfig(task.task_status);
    const daysRemaining = getDaysRemaining(task.due_date);
    const countdown = getDetailedCountdown(task.due_date);
    const isCompleted = task.task_status.toLowerCase() === 'completed';
    const isPendingReview = task.task_status.toLowerCase() === 'pending_review' || task.task_status.toLowerCase() === 'turn in';
    const isRejected = task.task_status.toLowerCase() === 'rejected';

    // Import column type colors utility
    const { getColumnTypeColors } = require('../utils/taskStatusColors');
    
    // กำหนดสีตามประเภทคอลัมน์ - ใช้ utility function
    const columnColors = getColumnTypeColors(columnType);
    const statusIndicatorColor = columnColors.statusIndicatorColor;
    const countdownStyle = columnColors.countdownStyle;

    return (
      <div 
        key={task.id} 
        className="border border-gray-200 bg-white rounded-lg p-4 hover:shadow-md transition-all duration-200 mb-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-base leading-tight truncate mb-1">
              {task.task_name}
            </h4>
            {task.project && (
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">
                {task.project.project_name}
              </div>
            )}
          </div>
          
          {/* Status indicator ใช้สีตามคอลัมน์ */}
          <div className={`w-3 h-3 rounded-full ${statusIndicatorColor} flex-shrink-0 ml-2`}></div>
        </div>

        {/* Due date */}
        <div className="text-xs text-gray-600 mb-2">
          {formatDate(task.due_date)} • {new Date(task.due_date).toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })}
        </div>
        
        {/* Status and Countdown */}
        {isCompleted && (
          <div className={`text-center py-2 px-3 rounded text-xs font-medium ${countdownStyle}`}>
            ✓ เสร็จแล้ว
          </div>
        )}
        
        {isPendingReview && (
          <div className={`text-center py-2 px-3 rounded text-xs font-medium ${countdownStyle}`}>
            ⏳ รอตรวจสอบ
          </div>
        )}
        
        {isRejected && (
          <div className={`text-center py-2 px-3 rounded text-xs font-medium ${countdownStyle}`}>
            ❌ ไม่ผ่าน - ต้องแก้ไข
          </div>
        )}
        
        {/* Countdown - เฉพาะงานที่ยังไม่เสร็จ, ไม่รอตรวจ, ไม่ถูกปฏิเสธ */}
        {!isCompleted && !isPendingReview && !isRejected && (
          <div className={`text-center py-2 px-3 rounded text-xs font-medium ${countdownStyle}`}>
            {countdown.isOverdue ? (columnType === 'overdue' ? `เลยกำหนดมา ${countdown.text}` : `เลย ${countdown.text}`) : `เหลือ ${countdown.text}`}
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

  // สถิติสรุป - คำนวณให้ตรงกับการแบ่งช่องตามสถานะใหม่
  const completedTasks = tasks.filter(task => task.task_status.toLowerCase() === 'completed');
  
  const pendingReviewTasks = tasks.filter(task => 
    task.task_status.toLowerCase() === 'pending_review' || task.task_status.toLowerCase() === 'turn in'
  );
  
  const rejectedTasks = tasks.filter(task => task.task_status.toLowerCase() === 'rejected');
  
  // งานที่เลยกำหนด (ยังไม่ส่ง + เลยกำหนดแล้ว)
  const overdueTasksOnly = tasks.filter(task => {
    const isNotSubmitted = task.task_status.toLowerCase() === 'not turn in' || 
                          task.task_status.toLowerCase() === 'pending' ||
                          task.task_status.toLowerCase() === 'overdue';
    if (!isNotSubmitted) return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'overdue' || task.task_status.toLowerCase() === 'overdue';
  });
  
  // งานที่ใกล้ถึงกำหนด (ยังไม่ส่ง + เหลือเวลา 0-3 วัน)
  const urgentAndTodayTasks = tasks.filter(task => {
    const isNotSubmitted = task.task_status.toLowerCase() === 'not turn in' || 
                          task.task_status.toLowerCase() === 'pending';
    if (!isNotSubmitted) return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'urgent' || remaining.status === 'today';
  });
  
  // งานที่ยังมีเวลา (ยังไม่ส่ง + เหลือเวลามากกว่า 3 วัน)
  const normalTasks = tasks.filter(task => {
    const isNotSubmitted = task.task_status.toLowerCase() === 'not turn in' || 
                          task.task_status.toLowerCase() === 'pending';
    if (!isNotSubmitted) return false;
    const remaining = getDaysRemaining(task.due_date);
    return remaining.status === 'normal' || remaining.status === 'soon';
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  สวัสดี {user?.username}! นี่คือภาพรวมงานทั้งหมดของคุณ
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">งานทั้งหมด</h3>
                  <p className="text-4xl font-bold text-blue-600">{tasks.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards - Updated with new statuses */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {/* Overdue Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-red-700 mb-1">เลยกำหนด</h3>
                  <p className="text-2xl font-bold text-red-600">{overdueTasksOnly.length}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Urgent Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-orange-700 mb-1">ใกล้กำหนด</h3>
                  <p className="text-2xl font-bold text-orange-600">{urgentAndTodayTasks.length}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Normal Tasks - ยังมีเวลา */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-1">ยังมีเวลา</h3>
                  <p className="text-2xl font-bold text-gray-600">{normalTasks.length}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Pending Review Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-700 mb-1">รอตรวจสอบ</h3>
                  <p className="text-2xl font-bold text-blue-600">{pendingReviewTasks.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Rejected Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-orange-700 mb-1">ไม่ผ่าน</h3>
                  <p className="text-2xl font-bold text-orange-600">{rejectedTasks.length}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-green-700 mb-1">เสร็จแล้ว</h3>
                  <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Six Columns Section - Updated with new statuses */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* งานที่เลยกำหนด */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-red-700 mb-3 border-b border-red-200 pb-2">เลยกำหนด</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {overdueTasksOnly.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ไม่มีงานค้าง</p>
                  </div>
                ) : (
                  overdueTasksOnly.map(task => renderCompactTaskCard(task, 'overdue'))
                )}
              </div>
            </div>

            {/* งานที่ใกล้ถึงกำหนด */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-orange-700 mb-3 border-b border-orange-200 pb-2">ใกล้กำหนด</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {urgentAndTodayTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ไม่มีงานเร่งด่วน</p>
                  </div>
                ) : (
                  urgentAndTodayTasks.map(task => renderCompactTaskCard(task, 'urgent'))
                )}
              </div>
            </div>

            {/* งานที่ยังมีเวลา */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">ยังมีเวลา</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {normalTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ไม่มีงานในช่วงนี้</p>
                  </div>
                ) : (
                  normalTasks.map(task => renderCompactTaskCard(task, 'normal'))
                )}
              </div>
            </div>

            {/* งานที่รอตรวจสอบ */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-blue-700 mb-3 border-b border-blue-200 pb-2">รอตรวจสอบ</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {pendingReviewTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ไม่มีงานรอตรวจ</p>
                  </div>
                ) : (
                  pendingReviewTasks.map(task => renderCompactTaskCard(task, 'pending_review'))
                )}
              </div>
            </div>

            {/* งานที่ไม่ผ่าน */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-orange-700 mb-3 border-b border-orange-200 pb-2">ไม่ผ่าน</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {rejectedTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ไม่มีงานถูกปฏิเสธ</p>
                  </div>
                ) : (
                  rejectedTasks.map(task => renderCompactTaskCard(task, 'rejected'))
                )}
              </div>
            </div>

            {/* งานที่เสร็จแล้ว */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-bold text-green-700 mb-3 border-b border-green-200 pb-2">เสร็จแล้ว</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 text-xs">ยังไม่มีงานเสร็จ</p>
                  </div>
                ) : (
                  completedTasks.map(task => renderCompactTaskCard(task, 'completed'))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
