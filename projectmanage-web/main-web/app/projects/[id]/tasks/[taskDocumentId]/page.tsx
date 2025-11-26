'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../../components/Nabbar_main/Navbar';
import Sidebar from '../../../../components/Sidebar';
import SubmissionModal from '../../../../components/SubmissionModal';
import TaskStatusIcon from '../../../../components/TaskStatusIcon';

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
  const [userRole, setUserRole] = useState<string>('Member');
  const [updating, setUpdating] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitComment, setSubmitComment] = useState('');
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({}); // เก็บชื่อไฟล์ที่กำหนดเอง
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null); // ติดตามไฟล์ที่กำลังแก้ไข
  const [showAddFileModal, setShowAddFileModal] = useState(false); // แสดง Add File Modal
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // ไฟล์ที่รอการยืนยันใน modal
  const [pendingFileNames, setPendingFileNames] = useState<{ [key: number]: string }>({}); // ชื่อไฟล์ใน modal
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    taskName: '',
    description: '',
    dueDate: '',
    dueTime: '',
    assignedUserId: null as number | null
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Review states
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  
  // Task management states
  const [showTaskMenu, setShowTaskMenu] = useState(false);

  // Handle file selection (verify file then open modal)
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

    // เปิด modal แทนการเพิ่มไฟล์โดยตรง
    setPendingFiles([file]);
    setPendingFileNames({});
    setShowAddFileModal(true);
  };

  // Handle add file from modal
  const handleConfirmAddFile = () => {
    if (pendingFiles.length === 0) return;
    
    // เพิ่มไฟล์เข้าไปใน selected files
    setSelectedFiles(prev => [...prev, ...pendingFiles]);
    
    // เพิ่มชื่อไฟล์ที่กำหนดเองถ้ามี
    const newFileNames = { ...fileNames };
    pendingFiles.forEach((file, index) => {
      const currentIndex = selectedFiles.length + index;
      if (pendingFileNames[index]) {
        newFileNames[currentIndex] = pendingFileNames[index];
      }
    });
    setFileNames(newFileNames);
    
    // ปิด modal และรีเซ็ต
    setShowAddFileModal(false);
    setPendingFiles([]);
    setPendingFileNames({});
  };

  // Handle rename pending file
  const handleRenamePendingFile = (index: number, newName: string) => {
    setPendingFileNames(prev => ({
      ...prev,
      [index]: newName
    }));
  };

  // Get pending file display name
  const getPendingFileName = (index: number, originalName: string) => {
    return pendingFileNames[index] || originalName;
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

  // Handle submit work (เปิด modal เพื่อให้ user เขียน comment)
  const handleSubmitWork = async () => {
    // เปิด modal แทนที่จะส่งงานทันที
    if (!selectedFiles.length) {
      alert('กรุณาเลือกไฟล์ก่อนส่งงาน');
      return;
    }
    setSubmitComment('');
    setShowSubmitModal(true);
  };

  // Handle confirm submit (ยืนยันการส่งงานหลังจากเขียน comment)
  const handleConfirmSubmit = async () => {
    if (!selectedFiles.length || !task || !user) {
      alert('กรุณาเลือกไฟล์ก่อนส่งงาน');
      return;
    }

    try {
      setSubmitting(true);
      const uploadedFiles: any[] = [];

      console.log('Starting file upload...'); // debug

      // อัปโหลดไฟล์ทีละไฟล์
      for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
        const file = selectedFiles[fileIndex];
        const customName = fileNames[fileIndex] || '';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskDocumentId', taskDocumentId);
        formData.append('projectDocumentId', projectId);
        formData.append('userId', user.id.toString());
        // ส่งชื่อไฟล์ที่กำหนดเองถ้ามี
        if (customName) {
          formData.append('customFileName', customName);
        }

        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (uploadResponse.data.success) {
          uploadedFiles.push({
            fileName: uploadResponse.data.fileName, // ใช้ชื่อไฟล์ที่ส่งกลับมาจาก API
            fileUrl: uploadResponse.data.fileUrl
          });
          console.log('File uploaded:', uploadResponse.data.fileName); // debug
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      console.log('Creating submissions...'); // debug

      // สร้าง submission สำหรับแต่ละไฟล์
      for (const uploadedFile of uploadedFiles) {
        const submissionResponse = await axios.post('/api/submissions', {
          task_document_id: taskDocumentId,
          task_id_number: task.id,
          submitted_by_user_id_number: user.id,
          comments: submitComment || `ส่งงาน: ${uploadedFile.fileName}`,
          file_url: uploadedFile.fileUrl
        });

        if (!submissionResponse.data.success) {
          throw new Error(`Failed to create submission for ${uploadedFile.fileName}`);
        }
        console.log('Submission created:', uploadedFile.fileName); // debug
      }

      console.log('Updating task status...'); // debug

      // อัปเดตสถานะ task เป็น "pending_review" (รอการตรวจสอบ)
      await handleStatusUpdate('pending_review');
      
      // รอเล็กน้อยเพื่อให้ส่วนแบ็กเอนด์บันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Refreshing submissions...'); // debug
      
      setSelectedFiles([]); // ล้างไฟล์ที่เลือก
      setSubmitComment(''); // ล้าง comment
      setFileNames({}); // ล้างชื่อไฟล์ที่กำหนดเอง
      setEditingFileIndex(null); // ยกเลิกการแก้ไขชื่อไฟล์
      setShowSubmitModal(false); // ปิด modal
      await refreshSubmissions();
      
      console.log('Done!'); // debug

      // แสดงข้อความสำเร็จ
      alert('ส่งงานเรียบร้อยแล้ว!');

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
    // ลบชื่อไฟล์ที่กำหนดเองด้วย
    const newFileNames = { ...fileNames };
    delete newFileNames[indexToRemove];
    setFileNames(newFileNames);
  };

  // Handle rename file
  const handleRenameFile = (index: number, newName: string) => {
    setFileNames(prev => ({
      ...prev,
      [index]: newName
    }));
  };

  // Get display name for file (use custom name if provided, otherwise original name)
  const getFileName = (index: number, originalName: string) => {
    return fileNames[index] || originalName;
  };

  // Handle cancel submission (ยกเลิกการเลือกไฟล์ทั้งหมด)
  const handleCancelSubmission = () => {
    setSelectedFiles([]);
    setFileNames({}); // ล้างชื่อไฟล์ที่กำหนดเอง
  };

  // Initialize edit form
  const initializeEditForm = () => {
    if (task) {
      let dateStr = '';
      let timeStr = '';
      
      if (task.due_date) {
        const dueDateTime = new Date(task.due_date);
        dateStr = dueDateTime.toISOString().split('T')[0];
        timeStr = dueDateTime.toTimeString().split(' ')[0].slice(0, 5);
      }
      
      setEditForm({
        taskName: task.task_name,
        description: task.description || '',
        dueDate: dateStr,
        dueTime: timeStr,
        assignedUserId: task.assigned_to_user_ids_number || null
      });
    }
  };

  // Handle edit task
  const handleEditTask = async () => {
    if (!task?.documentId) return;

    if (!editForm.taskName.trim()) {
      return;
    }
    
    if (!editForm.dueDate) {
      return;
    }

    try {
      setEditLoading(true);
      
      // รวมวันที่และเวลา
      let combinedDueDate = editForm.dueDate;
      if (editForm.dueTime) {
        combinedDueDate = `${editForm.dueDate}T${editForm.dueTime}:00.000Z`;
      }
      
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_name: editForm.taskName,
        description: editForm.description,
        due_date: combinedDueDate,
        assigned_to_user_ids_number: editForm.assignedUserId,
      });

      if (response.data.success) {
        // อัปเดต task ใน state
        setTask(prev => prev ? {
          ...prev,
          task_name: editForm.taskName,
          description: editForm.description,
          due_date: combinedDueDate,
          assigned_to_user_ids_number: editForm.assignedUserId || undefined,
        } : null);

        // อัปเดตข้อมูล assigned user
        if (editForm.assignedUserId) {
          try {
            const assignedUserResponse = await axios.get(`/api/users?userId=${editForm.assignedUserId}`);
            if (assignedUserResponse.data.user) {
              setAssignedUser(assignedUserResponse.data.user);
            }
          } catch (assignedUserError) {
            console.log('Could not fetch assigned user data:', assignedUserError);
          }
        } else {
          setAssignedUser(null);
        }
        
        setIsEditing(false);
        // alert('แก้ไข Task เรียบร้อยแล้ว!');
      } else {
        // alert('เกิดข้อผิดพลาดในการแก้ไข Task: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error editing task:', error);
      // alert('เกิดข้อผิดพลาดในการแก้ไข Task: ' + (error.response?.data?.message || error.message));
    } finally {
      setEditLoading(false);
    }
  };

  // Handle start editing
  const handleStartEdit = () => {
    initializeEditForm();
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      taskName: '',
      description: '',
      dueDate: '',
      dueTime: '',
      assignedUserId: null
    });
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!task?.documentId) return;
    
    // Check if confirmation text matches task name
    if (deleteConfirmText !== task.task_name) {
      alert('กรุณาพิมพ์ชื่อ Task ให้ถูกต้อง');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await axios.delete(`/api/tasks/${task.documentId}`);

      if (response.data.success) {
        alert('ลบ Task สำเร็จ');
        router.push(`/projects/${projectId}`);
      } else {
        alert('เกิดข้อผิดพลาดในการลบ Task');
      }
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert('เกิดข้อผิดพลาดในการลบ Task: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle show delete modal
  const handleShowDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  // Handle review task (for Leaders)
  const handleReviewTask = async () => {
    if (!task?.documentId || !reviewAction) return;

    try {
      setReviewLoading(true);
      
      const newStatus = reviewAction === 'approve' ? 'completed' : 'rejected';
      
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_status: newStatus
      });

      if (response.data.success) {
        // Create submission entry for review comment if provided
        if (reviewComment.trim()) {
          try {
            await axios.post('/api/submissions', {
              task_document_id: taskDocumentId,
              task_id_number: task.id,
              comments: `${reviewAction === 'approve' ? '✅ อนุมัติ' : '❌ ไม่อนุมัติ'}: ${reviewComment}`,
              file_url: null // No file for review comments
            });
          } catch (submissionError) {
            console.error('Error creating review submission:', submissionError);
          }
        }

        // Update task status
        setTask(prev => prev ? { ...prev, task_status: newStatus } : null);
        
        // Refresh submissions to show review comment
        await refreshSubmissions();
        
        // Close modal and reset
        setShowReviewModal(false);
        setReviewAction(null);
        setReviewComment('');
        
        alert(reviewAction === 'approve' ? 'อนุมัติงานเรียบร้อยแล้ว' : 'ไม่อนุมัติงาน กรุณาแจ้งให้ผู้ส่งงานแก้ไข');
      } else {
        alert('เกิดข้อผิดพลาดในการตรวจสอบงาน');
      }
    } catch (error: any) {
      console.error('Error reviewing task:', error);
      alert('เกิดข้อผิดพลาดในการตรวจสอบงาน: ' + (error.response?.data?.message || error.message));
    } finally {
      setReviewLoading(false);
    }
  };

  // Handle show review modal
  const handleShowReviewModal = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setShowReviewModal(true);
    setReviewComment('');
  };

  // Handle close review modal
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewAction(null);
    setReviewComment('');
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
            
            // ตรวจสอบบทบาทของผู้ใช้
            if (currentUser && projectResponse.data.project) {
              const currentUserId = currentUser.id;
              const project = projectResponse.data.project;
              
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

  // Close task menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showTaskMenu && !target.closest('.task-menu-container')) {
        setShowTaskMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTaskMenu]);

  // Handle submission refresh
  const refreshSubmissions = async () => {
    if (!taskDocumentId) return;
    
    try {
      // เพิ่ม timestamp เพื่อหลีกเลี่ยง cache
      const timestamp = new Date().getTime();
      const submissionsResponse = await axios.get(`/api/submissions?taskDocumentId=${taskDocumentId}&t=${timestamp}`);
      console.log('Refreshed submissions:', submissionsResponse.data); // debug
      
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
        console.log('Submissions with user info:', submissionsWithUserInfo); // debug
        setSubmissions(submissionsWithUserInfo);
      } else {
        console.log('No submissions found or error:', submissionsResponse.data); // debug
        setSubmissions([]);
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

  // Import color utility
  const { getTaskStatusConfig } = require('../../../../utils/taskStatusColors');
  
  // Get status config - ใช้ utility function สำหรับสีการ์ด
  const getStatusConfig = (status: string) => {
    const config = getTaskStatusConfig(status);
    return {
      bgColor: config.lightBgColor, // ใช้สีพื้นหลังแบบการ์ด
      textColor: config.textColor,
      borderColor: config.borderColor,
      badgeColor: config.badgeColor, // สำหรับ badge
      indicatorColor: config.indicatorColor, // สำหรับจุดสถานะ
      statusText: config.text, // ใช้ข้อความสถานะแบบการ์ด
      description: config.description,
      descriptionColor: config.descriptionColor,
      iconBg: config.iconBg,
      icon: <TaskStatusIcon status={status} className="w-6 h-6" />
    };
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
        {/* <Sidebar /> */}
        
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
                {!isEditing ? (
                  // Display Mode
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {task.task_name}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>สร้างเมื่อ {formatDate(task.createdAt)}</span>
                      {task.updatedAt !== task.createdAt && (
                        <span>• แก้ไขล่าสุด {formatDate(task.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">แก้ไข Task</h2>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="ยกเลิกการแก้ไข"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Edit Form */}
                    <div className="space-y-4">
                      {/* Task Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ชื่อ Task <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.taskName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, taskName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                          placeholder="ใส่ชื่อ Task"
                          disabled={editLoading}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          รายละเอียด
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                          placeholder="ใส่รายละเอียดของ Task (ไม่บังคับ)"
                          disabled={editLoading}
                        />
                      </div>

                      {/* Due Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            วันที่กำหนดส่ง <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            disabled={editLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            เวลากำหนดส่ง
                          </label>
                          <input
                            type="time"
                            value={editForm.dueTime}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dueTime: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            disabled={editLoading}
                          />
                        </div>
                      </div>

                      {/* Assigned User */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          มอบหมายให้
                        </label>
                        <select
                          value={editForm.assignedUserId || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, assignedUserId: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                          disabled={editLoading}
                        >
                          <option value="">เลือกผู้รับผิดชอบ</option>
                          {projectMembers.map((member) => (
                            <option 
                              key={member.id} 
                              value={member.userInfo?.id || member.user_id_in_project}
                            >
                              {member.userInfo?.username || `User ${member.user_id_in_project}`} ({member.role_in_project})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all"
                          disabled={editLoading}
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={handleEditTask}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          disabled={editLoading}
                        >
                          {editLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>กำลังบันทึก...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>บันทึกการแก้ไข</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Description */}
              {task.description && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">รายละเอียด</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>
              )}



              {/* Task Files Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">ไฟล์งาน</h2>
                  {/* Add File Button - แสดงเฉพาะคนที่ได้รับมอบหมาย และยังไม่ได้ส่งงาน */}
                  {user && task.assigned_to_user_ids_number === user.id && (task.task_status === 'not turn in' || task.task_status === 'rejected') && (
                    <label className="inline-block">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileSelectFromInput}
                        multiple
                      />
                      <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>เพิ่มไฟล์</span>
                      </span>
                    </label>
                  )}
                  {/* Info message when submission is not allowed */}
                
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-blue-900">
                        ไฟล์ที่เลือก ({selectedFiles.length})
                      </h3>
                      <button
                        onClick={handleCancelSubmission}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        ลบทั้งหมด
                      </button>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded text-xs">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              {editingFileIndex === index ? (
                                <input
                                  type="text"
                                  value={fileNames[index] || ''}
                                  onChange={(e) => handleRenameFile(index, e.target.value)}
                                  onBlur={() => setEditingFileIndex(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingFileIndex(null);
                                    if (e.key === 'Escape') {
                                      handleRenameFile(index, '');
                                      setEditingFileIndex(null);
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-blue-400 rounded text-xs font-medium bg-white text-blue-900"
                                  placeholder={file.name}
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <p className="font-medium text-blue-900 truncate cursor-pointer hover:text-blue-700" onClick={() => setEditingFileIndex(index)} title="คลิกเพื่อเปลี่ยนชื่อ">
                                    {fileNames[index] || file.name}
                                  </p>
                                  <p className="text-blue-700">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSelectedFile(index)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
                          {user && submission.submitted_by_user_id_number === user.id && (task.task_status === 'not turn in' || task.task_status === 'rejected') && (
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
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="รีเฟรชข้อมูล"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-600 text-sm">ยังไม่มีประวัติการส่งงาน</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg pl-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">
                              {submission.submittedByUser?.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{submission.submittedByUser?.username}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(submission.submission_date)}</p>
                          </div>
                        </div>
                        
                        {submission.comments && (
                          <div className="bg-white rounded p-2 mb-2 text-sm text-gray-700">
                            {submission.comments}
                          </div>
                        )}
                        
                        {submission.file_url && (
                          <div className="flex items-center space-x-1 text-xs bg-blue-100 rounded p-1.5">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-blue-800 font-medium truncate">
                              {submission.file_url.split('/').pop()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Task Info & Actions */}
            <div className="space-y-6">
              {/* Project Leader Section - Only for Leaders */}
              {userRole === 'Leader' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">สำหรับ Project Leader</h3>
                  
                  {/* Project Management Button */}
                  <div className="mb-4">
                    <button
                      onClick={() => window.location.href = `/projects/${projectId}`}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>จัดการโปรเจค</span>
                    </button>
                  </div>

                  {/* Task Management Button */}
                  <div className="relative task-menu-container">
                    <button
                      onClick={() => setShowTaskMenu(!showTaskMenu)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      <span>จัดการ Task</span>
                      <svg className={`w-4 h-4 transition-transform ${showTaskMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showTaskMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <button
                          onClick={() => {
                            handleStartEdit();
                            setShowTaskMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>แก้ไข Task</span>
                        </button>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={() => {
                            handleShowDeleteModal();
                            setShowTaskMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>ลบ Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Task Information Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูล Task</h3>
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">สถานะ</label>
                    <div className={`inline-flex items-center space-x-3 px-4 py-3 ${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg`}>
                      {/* Status Indicator */}
                      <div className={`w-3 h-3 rounded-full ${statusConfig.indicatorColor} flex-shrink-0`}></div>
                      
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.badgeColor} text-white`}>
                        {statusConfig.statusText}
                      </div>
                      
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusConfig.iconBg}`}>
                        {statusConfig.icon}
                      </div>
                    </div>
                  </div>

                  {/* Assigned User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">ผู้รับผิดชอบ</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {assignedUser ? assignedUser.username.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {assignedUser ? assignedUser.username : 'ไม่ได้กำหนด'}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">กำหนดส่ง</label>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(task.due_date)}</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">อัปเดตล่าสุด</label>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(task.updatedAt)}</span>
                    </div>
                  </div>
                </div>


              </div>

              {/* Task Actions for Assignee */}
              {user && task.assigned_to_user_ids_number === user.id && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดการงาน</h3>
                  
                  {/* Countdown Timer */}
                  {timeLeft && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">เวลาที่เหลือ</label>
                      {timeLeft.isOverdue ? (
                        <div className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg p-3`}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${statusConfig.indicatorColor}`}></div>
                            <span className={`${statusConfig.textColor} font-medium`}>เลยกำหนดส่งแล้ว</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg p-3`}>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <div className={`text-lg font-bold ${statusConfig.textColor.replace('text-', 'text-').replace('-800', '-600')}`}>{timeLeft.days}</div>
                              <div className="text-xs text-gray-500">วัน</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <div className={`text-lg font-bold ${statusConfig.textColor.replace('text-', 'text-').replace('-800', '-600')}`}>{timeLeft.hours}</div>
                              <div className="text-xs text-gray-500">ชม.</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <div className={`text-lg font-bold ${statusConfig.textColor.replace('text-', 'text-').replace('-800', '-600')}`}>{timeLeft.minutes}</div>
                              <div className="text-xs text-gray-500">นาที</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <div className={`text-lg font-bold ${statusConfig.textColor.replace('text-', 'text-').replace('-800', '-600')}`}>{timeLeft.seconds}</div>
                              <div className="text-xs text-gray-500">วิ.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {task.task_status === 'turn in' || task.task_status === 'pending_review' ? (
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
                      <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600 text-sm">เลือกไฟล์เพื่อส่งงาน</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Section - Show when task needs review - Only for Leaders */}
              {userRole === 'Leader' && (task.task_status === 'pending_review' || task.task_status === 'turn in') && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ตรวจสอบงาน</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800 font-medium">งานรอการตรวจสอบ</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      งานนี้ได้รับการส่งแล้ว กรุณาตรวจสอบและให้ผลการตรวจสอบ
                    </p>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowReviewModal('approve')}
                        disabled={reviewLoading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>อนุมัติ</span>
                      </button>
                      
                      <button
                        onClick={() => handleShowReviewModal('reject')}
                        disabled={reviewLoading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>ไม่อนุมัติ</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>      {/* Submission Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && task && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-red-600 flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>ยืนยันการลบ Task</span>
              </h3>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>คำเตือน:</strong> การดำเนินการนี้ไม่สามารถย้อนกลับได้ Task และข้อมูลทั้งหมดจะถูกลบอย่างถาวร
                </p>
              </div>

              <p className="text-gray-700 mb-4">
                คุณกำลังจะลบ Task: <strong className="text-gray-900">"{task.task_name}"</strong>
              </p>

              <p className="text-gray-700 mb-4">
                เพื่อยืนยันการลบ กรุณาพิมพ์ชื่อ Task ในช่องด้านล่าง:
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พิมพ์ชื่อ Task: <span className="font-semibold text-red-600">"{task.task_name}"</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                  placeholder="พิมพ์ชื่อ Task เพื่อยืนยัน"
                  disabled={isDeleting}
                />
              </div>

              {deleteConfirmText && deleteConfirmText !== task.task_name && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ชื่อ Task ไม่ตรงกัน กรุณาพิมพ์ให้ถูกต้อง
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting || deleteConfirmText !== task.task_name}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>ลบ Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && task && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                reviewAction === 'approve' ? 'text-green-600' : 'text-red-600'
              }`}>
                {reviewAction === 'approve' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{reviewAction === 'approve' ? 'อนุมัติงาน' : 'ไม่อนุมัติงาน'}</span>
              </h3>
              <button
                onClick={handleCloseReviewModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={reviewLoading}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className={`border rounded-lg p-4 mb-4 ${
                reviewAction === 'approve' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  reviewAction === 'approve' ? 'text-green-800' : 'text-red-800'
                }`}>
                  <strong>Task:</strong> {task.task_name}
                </p>
                <p className={`text-sm mt-1 ${
                  reviewAction === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  คุณกำลังจะ{reviewAction === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}งานนี้
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความคิดเห็น {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                  placeholder={reviewAction === 'approve' 
                    ? 'ความคิดเห็นเพิ่มเติม (ไม่บังคับ)' 
                    : 'กรุณาระบุเหตุผลที่ไม่อนุมัติ (บังคับ)'
                  }
                  disabled={reviewLoading}
                />
              </div>

              {reviewAction === 'reject' && !reviewComment.trim() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    กรุณาระบุเหตุผลในการไม่อนุมัติ
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseReviewModal}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
                disabled={reviewLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReviewTask}
                disabled={reviewLoading || (reviewAction === 'reject' && !reviewComment.trim())}
                className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {reviewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <>
                    {reviewAction === 'approve' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{reviewAction === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>ยืนยันการส่งงาน</span>
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={submitting}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 font-medium mb-2">ไฟล์ที่จะส่ง:</p>
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-blue-800">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">{getFileName(index, file.name)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความเห็น / หมายเหตุ (ไม่บังคับ)
                </label>
                <textarea
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                  placeholder="เขียนความเห็นหรือข้อความเพิ่มเติม (เช่น หมายเหตุเกี่ยวกับการส่งงาน ปัญหาที่พบ ฯลฯ)"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ถ้าไม่เขียนอะไร จะใช้ข้อความเริ่มต้นแทน
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
                disabled={submitting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>กำลังส่งงาน...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>ยืนยันและส่งงาน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add File Modal */}
      {showAddFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>เพิ่มไฟล์</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddFileModal(false);
                  setPendingFiles([]);
                  setPendingFileNames({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 font-medium mb-3">ไฟล์ที่จะเพิ่ม:</p>
                <div className="space-y-2">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="p-4 bg-white border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">ชื่อไฟล์เดิม</p>
                          <p className="text-xs text-gray-600 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Save Name As <span className="text-gray-500 text-xs">(เปลี่ยนชื่อไฟล์)</span>
                        </label>
                        <input
                          type="text"
                          value={pendingFileNames[index] || ''}
                          onChange={(e) => handleRenamePendingFile(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder={file.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                <strong>หมายเหตุ:</strong> คุณสามารถเปลี่ยนชื่อไฟล์ได้ในช่องด้านบน โดยค่าเริ่มต้นจะใช้ชื่อไฟล์เดิม
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddFileModal(false);
                  setPendingFiles([]);
                  setPendingFileNames({});
                }}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAddFile}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>ยืนยันและเพิ่มไฟล์</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
