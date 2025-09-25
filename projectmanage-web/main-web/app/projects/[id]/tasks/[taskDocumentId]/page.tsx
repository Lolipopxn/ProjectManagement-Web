'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../../components/Navbar';
import Sidebar from '../../../../components/Sidebar';
import SubmissionModal from '../../../../components/SubmissionModal';

// Interface สำหรับ submission data
interface Submission {
  id: number;
  documentId?: string;
  task_document_id: string;
  task_id_number: number;
  submitted_by_user_id_number: number;
  submission_date: string;
  comments?: string;
  file_url?: string;
  submittedByUser?: {
    id: number;
    username: string;
    email?: string;
  };
}

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);

  // Handle file selection (เก็บไฟล์ไว้ก่อน ไม่อัปโหลดทันที)
  const handleFileSelect = (file: File) => {
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB');
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ .pdf, .doc, .docx, .jpg หรือ .png');
      return;
    }

    // ตรวจสอบว่าไฟล์นี้มีอยู่แล้วหรือไม่
    const isDuplicate = selectedFiles.some(existingFile => 
      existingFile.name === file.name && existingFile.size === file.size
    );

    if (isDuplicate) {
      alert('ไฟล์นี้ถูกเลือกไปแล้ว');
      return;
    }

    // เพิ่มไฟล์ใหม่เข้าไปใน array
    setSelectedFiles(prev => [...prev, file]);
  };

  // Handle file selection from input
  const handleFileSelectFromInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // ประมวลผลไฟล์ทีละไฟล์
      Array.from(files).forEach(file => {
        handleFileSelect(file);
      });
    }
    // ล้างค่า input เพื่อให้สามารถเลือกไฟล์เดิมใหม่ได้
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      // ประมวลผลไฟล์ทีละไฟล์
      Array.from(files).forEach(file => {
        handleFileSelect(file);
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle file deletion
  const handleDeleteFile = async (submissionId: number) => {
    if (!confirm('คุณต้องการลบไฟล์นี้หรือไม่?')) return;

    try {
      const response = await axios.delete(`/api/submissions/${submissionId}`);
      if (response.data.success) {
        alert('ลบไฟล์เรียบร้อยแล้ว');
        await refreshSubmissions();
      } else {
        alert('เกิดข้อผิดพลาดในการลบไฟล์');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('เกิดข้อผิดพลาดในการลบไฟล์');
    }
  };

  // Handle submit work (อัปโหลดไฟล์และอัปเดตสถานะ)
  const handleSubmitWork = async () => {
    if (!selectedFiles.length || !task || !user) {
      alert('กรุณาเลือกไฟล์ก่อนส่งงาน');
      return;
    }

    try {
      setSubmitting(true);
      const uploadedFiles: any[] = [];

      // อัปโหลดไฟล์ทีละไฟล์
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskDocumentId', taskDocumentId);

        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (uploadResponse.data.success) {
          uploadedFiles.push({
            fileName: file.name,
            fileUrl: uploadResponse.data.fileUrl
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // สร้าง submission สำหรับแต่ละไฟล์
      for (const uploadedFile of uploadedFiles) {
        const submissionResponse = await axios.post('/api/submissions', {
          task_document_id: taskDocumentId,
          task_id_number: task.id,
          comments: `ส่งงาน: ${uploadedFile.fileName}`,
          file_url: uploadedFile.fileUrl
        });

        if (!submissionResponse.data.success) {
          throw new Error(`Failed to create submission for ${uploadedFile.fileName}`);
        }
      }

      // อัปเดตสถานะ task เป็น "turn in"
      await handleStatusUpdate('turn in');
      
      setSelectedFiles([]); // ล้างไฟล์ที่เลือก
      await refreshSubmissions();

    } catch (error: any) {
      console.error('Error submitting work:', error);
      if (error.response?.status === 413) {
        alert('ไฟล์มีขนาดใหญ่เกินไป');
      } else {
        alert(`เกิดข้อผิดพลาดในการส่งงาน: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove file from selected list
  const handleRemoveSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Handle cancel submission (ยกเลิกการเลือกไฟล์ทั้งหมด)
  const handleCancelSubmission = () => {
    setSelectedFiles([]);
  };

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
        let foundTask = null;
        
        if (taskResponse.data.success && taskResponse.data.tasks) {
          foundTask = taskResponse.data.tasks.find((t: Task) => t.documentId === taskDocumentId);
          
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

        // ดึงข้อมูล submissions
        if (foundTask) {
          try {
            const submissionsResponse = await axios.get(`/api/submissions?taskDocumentId=${taskDocumentId}`);
            if (submissionsResponse.data.success && submissionsResponse.data.submissions) {
              // ใช้วิธีเดิมในการดึงข้อมูล user ก่อน เพื่อแก้ปัญหา
              const submissionsWithUserInfo = await Promise.all(
                submissionsResponse.data.submissions.map(async (submission: any) => {
                  try {
                    const userResponse = await axios.get(`/api/users?userId=${submission.submitted_by_user_id_number}`);
                    return {
                      ...submission,
                      submittedByUser: userResponse.data.user || {
                        id: submission.submitted_by_user_id_number,
                        username: `User ${submission.submitted_by_user_id_number}`,
                        email: ''
                      }
                    };
                  } catch (userError) {
                    return {
                      ...submission,
                      submittedByUser: {
                        id: submission.submitted_by_user_id_number,
                        username: `User ${submission.submitted_by_user_id_number}`,
                        email: ''
                      }
                    };
                  }
                })
              );
              setSubmissions(submissionsWithUserInfo);
            }
          } catch (submissionsError) {
            console.error('Could not fetch submissions:', submissionsError);
          }
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

  // Update countdown timer
  useEffect(() => {
    if (!task?.due_date) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [task?.due_date]);

  // Handle submission refresh
  const refreshSubmissions = async () => {
    if (!taskDocumentId) return;
    
    try {
      const submissionsResponse = await axios.get(`/api/submissions?taskDocumentId=${taskDocumentId}`);
      if (submissionsResponse.data.success && submissionsResponse.data.submissions) {
        // ใช้วิธีเดิมในการดึงข้อมูล user ก่อน เพื่อแก้ปัญหา
        const submissionsWithUserInfo = await Promise.all(
          submissionsResponse.data.submissions.map(async (submission: any) => {
            try {
              const userResponse = await axios.get(`/api/users?userId=${submission.submitted_by_user_id_number}`);
              return {
                ...submission,
                submittedByUser: userResponse.data.user || {
                  id: submission.submitted_by_user_id_number,
                  username: `User ${submission.submitted_by_user_id_number}`,
                  email: ''
                }
              };
            } catch (userError) {
              return {
                ...submission,
                submittedByUser: {
                  id: submission.submitted_by_user_id_number,
                  username: `User ${submission.submitted_by_user_id_number}`,
                  email: ''
                }
              };
            }
          })
        );
        setSubmissions(submissionsWithUserInfo);
      }
    } catch (error) {
      console.error('Could not refresh submissions:', error);
    }
  };

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

  // Handle cancel work submission (ยกเลิกการส่งงาน - ลบ submission ทั้งหมดและเปลี่ยนสถานะ)
  const handleCancelWorkSubmission = async () => {
    if (!task?.documentId || !user) return;

    if (!confirm('คุณต้องการยกเลิกการส่งงานหรือไม่? ไฟล์ทั้งหมดจะถูกลบ')) return;

    try {
      setUpdating(true);

      // ลบ submission ทั้งหมดของ user ใน task นี้ผ่าน API ใหม่
      console.log(`Canceling submissions for task: ${taskDocumentId}`);
      
      const deleteResponse = await axios.delete(`/api/submissions/cancel-by-task?taskDocumentId=${taskDocumentId}`);
      
      console.log('Delete response:', deleteResponse.data);

      // เปลี่ยนสถานะ task เป็น "not turn in"
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_status: 'not turn in'
      });

      if (response.data.success) {
        setTask(prev => prev ? { ...prev, task_status: 'not turn in' } : null);
        
        const deleteData = deleteResponse.data;
        
        // รีเฟรช submissions
        await refreshSubmissions();
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error: any) {
      console.error('Error canceling submission:', error);
      
      // แสดงข้อมูล error แบบละเอียด
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        alert(`เกิดข้อผิดพลาดในการยกเลิกการส่งงาน: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      } else {
        console.error('Error message:', error.message);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      }
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

  // Format date with time function (สำหรับ submission date)
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Calculate time left until due date
  const calculateTimeLeft = () => {
    if (!task?.due_date) return null;

    const now = new Date().getTime();
    const dueDate = new Date(task.due_date).getTime();
    const difference = dueDate - now;

    if (difference < 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isOverdue: true
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isOverdue: false
    };
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'turn in':
      case 'completed':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          statusText: 'ส่งงานแล้ว',
          description: 'งานถูกส่งเรียบร้อยแล้ว',
          descriptionColor: 'text-green-600',
          iconBg: 'bg-green-200',
          icon: (
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'not turn in':
      case 'pending':
        return {
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          statusText: 'รอส่งงาน',
          description: 'ยังไม่ได้ส่งงาน กรุณาส่งก่อนครบกำหนด',
          descriptionColor: 'text-yellow-600',
          iconBg: 'bg-yellow-200',
          icon: (
            <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'overdue':
        return {
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          statusText: 'เลยกำหนด',
          description: 'เลยเวลาส่งงานแล้ว',
          descriptionColor: 'text-red-600',
          iconBg: 'bg-red-200',
          icon: (
            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          statusText: 'ไม่ระบุสถานะ',
          description: 'สถานะไม่ชัดเจน',
          descriptionColor: 'text-gray-600',
          iconBg: 'bg-gray-200',
          icon: (
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
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



              {/* Task Files Section - แสดงไฟล์ที่อัปโหลดสำหรับ Task นี้ */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ไฟล์งาน</h2>
                
                {/* Upload Area - แสดงเฉพาะคนที่ได้รับมอบหมาย */}
                {user && task.assigned_to_user_ids_number === user.id && (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-gray-400 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="text-center">
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-600">กำลังอัปโหลด...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gray-600 mb-2">ลากไฟล์มาวางที่นี่ หรือ</p>
                          <label className="inline-block">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={handleFileSelectFromInput}
                              multiple
                            />
                            <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
                              เลือกไฟล์
                            </span>
                          </label>
                          <p className="text-sm text-gray-500 mt-2">รองรับไฟล์ .pdf, .doc, .docx, .jpg, .png (ขนาดไม่เกิน 10MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Files Preview - แสดงไฟล์ที่เลือกก่อนส่ง */}
                {selectedFiles.length > 0 && (
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-blue-900">
                        ไฟล์ที่เลือก ({selectedFiles.length} ไฟล์):
                      </h3>
                      <button
                        onClick={handleCancelSubmission}
                        className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        ลบทั้งหมด
                      </button>
                    </div>

                    {/* Files List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-blue-900 text-sm">{file.name}</p>
                              <p className="text-xs text-blue-700">ขนาด: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSelectedFile(index)}
                            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded font-medium transition-colors"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files List */}
                <div className="space-y-3">
                  {submissions.filter(s => s.file_url).length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600">ยังไม่มีไฟล์ที่อัปโหลด</p>
                    </div>
                  ) : (
                    submissions.filter(s => s.file_url).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {submission.file_url?.split('/').pop() || 'ไฟล์แนบ'}
                            </p>
                            <p className="text-sm text-gray-500">
                              อัปโหลดโดย {submission.submittedByUser?.username} • {formatDateTime(submission.submission_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a 
                            href={submission.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            ดาวน์โหลด
                          </a>
                          {user && submission.submitted_by_user_id_number === user.id && (
                            <button 
                              onClick={() => handleDeleteFile(submission.id)}
                              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* History Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">ประวัติ ({submissions.length})</h2>
                  <button
                    onClick={refreshSubmissions}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="รีเฟรชข้อมูล"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-600">ยังไม่มีประวัติการส่งงาน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border-l-4 border-blue-500 pl-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">
                                  {submission.submittedByUser?.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{submission.submittedByUser?.username}</p>
                                <p className="text-sm text-gray-500">{formatDateTime(submission.submission_date)}</p>
                              </div>
                            </div>
                            
                            {submission.comments && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-gray-700 text-sm">{submission.comments}</p>
                              </div>
                            )}
                            
                            {submission.file_url && (
                              <div className="flex items-center space-x-2 text-sm bg-blue-50 rounded-lg p-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-blue-700 font-medium">
                                  แนบไฟล์: {submission.file_url.split('/').pop()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                      อัปเดตล่าสุด
                    </label>
                    <span className="text-gray-900">{formatDate(task.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Task Actions and Countdown */}
              {user && task.assigned_to_user_ids_number === user.id && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดการงาน</h3>
                  
                  {/* Countdown Timer */}
                  {timeLeft && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        เวลาที่เหลือ
                      </label>
                      {timeLeft.isOverdue ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-700 font-medium">เลยกำหนดส่งแล้ว</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-xl font-bold text-blue-600">{timeLeft.days}</div>
                              <div className="text-xs text-gray-500">วัน</div>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-xl font-bold text-blue-600">{timeLeft.hours}</div>
                              <div className="text-xs text-gray-500">ชั่วโมง</div>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-xl font-bold text-blue-600">{timeLeft.minutes}</div>
                              <div className="text-xs text-gray-500">นาที</div>
                            </div>
                            <div className="bg-white rounded-lg p-2">
                              <div className="text-xl font-bold text-blue-600">{timeLeft.seconds}</div>
                              <div className="text-xs text-gray-500">วินาที</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Actions */}
                  <div className="space-y-4">
                    {/* Current Status Display */}
                    <div className={`p-4 rounded-lg border-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                      <label className="block text-sm font-medium text-gray-600 mb-3">
                        สถานะงาน
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.iconBg}`}>
                          {statusConfig.icon}
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${statusConfig.textColor}`}>
                            {statusConfig.statusText}
                          </div>
                          <div className={`text-sm ${statusConfig.descriptionColor}`}>
                            {statusConfig.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {task.task_status === 'turn in' ? (
                      // Cancel Submission Button
                      <button
                        onClick={handleCancelWorkSubmission}
                        disabled={updating}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>กำลังยกเลิก...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>ยกเลิกการส่งงาน</span>
                          </>
                        )}
                      </button>
                    ) : selectedFiles.length > 0 ? (
                      // Submit Work Button
                      <button
                        onClick={handleSubmitWork}
                        disabled={submitting}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>กำลังส่งงาน...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>ส่งงาน ({selectedFiles.length} ไฟล์)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      // No Files Selected
                      <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600 text-sm">เลือกไฟล์ในส่วน "ไฟล์งาน" เพื่อส่งงาน</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {task && (
        <SubmissionModal 
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={refreshSubmissions}
          taskDocumentId={taskDocumentId}
          taskId={task.id}
          taskName={task.task_name}
        />
      )}
    </div>
  );
}
