'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import SubmissionModal from '../../../../../components/SubmissionModal';
import TaskStatusIcon from '../../../../../components/TaskStatusIcon';

// Interface สำหรับ submission data
interface Submission {
  id: number;
  documentId?: string;
  task_document_id: string;
  task_id_number: number;
  submitted_by_user_id_number: number;
  submission_date: string;
  submission_description?: string; // คำอธิบายจากผู้ส่งงาน
  comments?: string; // ความคิดเห็นจาก Leader หรือระบบ
  file_urls?: string[]; // เปลี่ยนเป็น array ของ URLs
  is_active: boolean; // true = ส่งงาน, false = ยกเลิกการส่ง
  cancelled_at?: string; // เวลาที่ยกเลิกการส่งงาน
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
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({}); // เก็บชื่อไฟล์ที่กำหนดเอง
  const [taskComment, setTaskComment] = useState(''); // comment รวมของ Task
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null); // ติดตามไฟล์ที่กำลังแก้ไข
  const [fileNameErrors, setFileNameErrors] = useState<{ [key: number]: string }>({}); // เก็บ error message สำหรับแต่ละไฟล์
  const [showFileManagementModal, setShowFileManagementModal] = useState(false); // ควบคุมการแสดง modal จัดการไฟล์
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({}); // ควบคุมการขยาย/ย่อคำอธิบายในประวัติ
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
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection (verify file then open modal)
  const handleFileSelect = (file: File) => {
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (50MB = 50 * 1024 * 1024 bytes)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 50MB');
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

    // เพิ่มไฟล์โดยตรง
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
      // เปิด modal จัดการไฟล์ทันทีเมื่อเลือกไฟล์
      if (files.length > 0) {
        setShowFileManagementModal(true);
      }
    }
    // ล้างค่า input เพื่อให้สามารถเลือกไฟล์เดิมใหม่ได้
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // ตรวจสอบว่าออกจาก drop zone จริงๆ
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      let addedCount = 0;
      // ประมวลผลไฟล์ทีละไฟล์
      Array.from(files).forEach(file => {
        // ตรวจสอบก่อนเพิ่ม
        const maxSize = 50 * 1024 * 1024;
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png'
        ];
        
        if (file.size > maxSize) {
          alert(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (สูงสุด 50MB)`);
          return;
        }
        
        if (!allowedTypes.includes(file.type)) {
          alert(`ไฟล์ "${file.name}" ประเภทไม่ถูกต้อง (รองรับ .pdf, .doc, .docx, .jpg, .png)`);
          return;
        }
        
        const isDuplicate = selectedFiles.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (!isDuplicate) {
          handleFileSelect(file);
          addedCount++;
        }
      });
      
      // เปิด modal ถ้ามีไฟล์ใหม่ถูกเพิ่ม
      if (addedCount > 0) {
        setShowFileManagementModal(true);
      }
    }
  };

  // Handle file deletion (soft delete - set is_active to false)
  const handleDeleteFile = async (submissionId: number, submissionDocumentId?: string) => {
    // หา submission ที่ต้องการลบ
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) {
      alert('ไม่พบไฟล์ที่ต้องการลบ');
      return;
    }

    const fileCount = submission.file_urls?.length || 0;
    const documentId = submissionDocumentId || submission.documentId;
    
    if (!documentId) {
      alert('ไม่สามารถลบไฟล์ได้ เนื่องจากไม่พบ Document ID');
      console.error('Missing documentId for submission:', submission);
      return;
    }
    
    if (!confirm(`คุณต้องการลบการส่งงานนี้หรือไม่?\n\n${fileCount > 0 ? `มีไฟล์แนบ ${fileCount} ไฟล์` : 'ไม่มีไฟล์แนบ'}\n\nการส่งงานจะถูกทำเครื่องหมายว่าถูกลบแล้ว`)) {
      return;
    }

    try {
      // Soft delete: อัพเดท is_active เป็น false โดยใช้ documentId
      console.log('Deleting submission with documentId:', documentId); // debug
      const response = await axios.delete(`/api/submissions/${documentId}`);
      
      if (response.data.success) {
        alert('ลบไฟล์เรียบร้อยแล้ว');
        await refreshSubmissions();
      } else {
        alert('เกิดข้อผิดพลาดในการลบไฟล์');
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบไฟล์';
      alert(errorMsg);
    }
  };

  // Handle submit work (เปิด modal ยืนยันการส่งงาน)
  const handleSubmitWork = async () => {
    // ไม่บังคับให้มีไฟล์ - สามารถส่งงานโดยไม่มีไฟล์ได้
    setShowSubmitModal(true);
  };

  // Handle confirm submit (ยืนยันการส่งงานหลังจากเขียน comment)
  const handleConfirmSubmit = async () => {
    if (!task || !user) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      return;
    }

    try {
      setSubmitting(true);
      const uploadedFiles: any[] = [];

      // ถ้ามีไฟล์ให้อัปโหลด
      if (selectedFiles.length > 0) {
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
      }

      console.log('Creating submission...'); // debug

      // สร้าง submission เดียว โดยไม่สนใจว่ามีไฟล์หรือไม่
      const fileUrls = uploadedFiles.map(f => f.fileUrl);
      const uploadedFileNames = uploadedFiles.map(f => f.fileName).join(', ');
      const defaultDescription = uploadedFiles.length > 0 
        ? `ส่งงาน: ${uploadedFileNames}` 
        : 'ส่งงานโดยไม่แนบไฟล์';
      
      const submissionResponse = await axios.post('/api/submissions', {
        task_document_id: taskDocumentId,
        task_id_number: task.id,
        submitted_by_user_id_number: user.id,
        submission_description: taskComment.trim() || defaultDescription,
        file_urls: fileUrls, // เก็บเป็น array (อาจจะว่างได้)
        is_active: true // ส่งงาน = active
      });

      if (!submissionResponse.data.success) {
        throw new Error('Failed to create submission');
      }
      
      console.log('Submission created with', fileUrls.length, 'files'); // debug

      console.log('Updating task status...'); // debug

      // อัปเดตสถานะ task เป็น "pending_review" (รอการตรวจสอบ)
      await handleStatusUpdate('pending_review');
      
      // รอเล็กน้อยเพื่อให้ส่วนแบ็กเอนด์บันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Refreshing submissions...'); // debug
      
      setSelectedFiles([]); // ล้างไฟล์ที่เลือก
      setFileNames({}); // ล้างชื่อไฟล์ที่กำหนดเอง
      setTaskComment(''); // ล้าง comment ของ Task
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

  // Validate file name format
  const validateFileName = (fileName: string): { isValid: boolean; message?: string } => {
    // ตรวจสอบว่าไม่เว้นว่าง
    if (!fileName.trim()) {
      return { isValid: false, message: 'กรุณาใส่ชื่อไฟล์' };
    }

    // ตรวจสอบความยาว
    if (fileName.length > 100) {
      return { isValid: false, message: 'ชื่อไฟล์ยาวเกินไป (สูงสุด 100 ตัวอักษร)' };
    }

    // ตรวจสอบอักขระที่ไม่อนุญาต (Windows + Linux)
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      return { isValid: false, message: 'ชื่อไฟล์มีอักขระที่ไม่อนุญาต (< > : " / \\ | ? *)' };
    }

    // ตรวจสอบว่าไม่ขึ้นต้นหรือลงท้ายด้วยช่องว่างหรือจุด
    if (fileName.startsWith(' ') || fileName.endsWith(' ') || fileName.endsWith('.')) {
      return { isValid: false, message: 'ชื่อไฟล์ไม่สามารถขึ้นต้นหรือลงท้ายด้วยช่องว่างหรือจุด' };
    }

    // ตรวจสอบชื่อสงวนของ Windows
    const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    const nameWithoutExt = fileName.split('.')[0];
    if (reservedNames.test(nameWithoutExt)) {
      return { isValid: false, message: 'ชื่อไฟล์นี้เป็นชื่อสงวนของระบบ' };
    }

    return { isValid: true };
  };

  // Handle rename file
  const handleRenameFile = (index: number, newName: string) => {
    // ถ้าเป็นการล้างชื่อ (กด Escape) ให้ล้างได้เลย
    if (newName === '') {
      setFileNames(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
      return;
    }

    // ถ้ามีการใส่ชื่อใหม่ ให้เก็บไว้ก่อน (จะ validate ตอน onBlur)
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
    setTaskComment(''); // ล้าง comment ของ Task
    setShowFileManagementModal(false); // ปิด modal
    setEditingFileIndex(null); // ยกเลิกการแก้ไขชื่อไฟล์
    setFileNameErrors({}); // ล้าง errors
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
        router.push(`/main_pages/projects/${projectId}`);
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
      
      // ⚠️ สำคัญ: อัปเดต comment ใน submission ก่อน เพื่อให้ backend อ่านได้
      if (reviewComment.trim()) {
        try {
          // หา submission ที่ active อยู่ของ task นี้
          const activeSubmissions = submissions.filter(s => s.is_active && s.task_document_id === taskDocumentId);
          
          if (activeSubmissions.length > 0) {
            // อัปเดต comment ใน submission ที่ active (ใส่เฉพาะข้อความที่พิมพ์เข้ามา)
            for (const submission of activeSubmissions) {
              if (submission.documentId) {
                await axios.put(`/api/submissions/${submission.documentId}`, {
                  comments: reviewComment
                });
                console.log('Updated review comment in submission BEFORE status change:', submission.documentId);
              }
            }
            
            // รอให้ข้อมูลถูกบันทึกก่อนเปลี่ยน status
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            // ถ้าไม่มี active submission ให้สร้างใหม่ (กรณี edge case)
            console.log('No active submission found, creating new one for review comment');
            await axios.post('/api/submissions', {
              task_document_id: taskDocumentId,
              task_id_number: task.id,
              comments: reviewComment,
              submission_description: '',
              file_urls: [],
              submitted_by_user_id_number: task.assigned_to_user_ids_number,
              is_active: true
            });
            
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (submissionError) {
          console.error('Error updating review comment in submission:', submissionError);
        }
      }
      
      // จากนั้นค่อยเปลี่ยน task status (จะ trigger lifecycle hook ที่อ่าน comment)
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_status: newStatus
      });

      if (response.data.success) {
        
        // Refresh submissions to show updated review comment
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

  // Handle cancel work submission (ยกเลิกการส่งงาน - เปลี่ยน is_active เป็น false และเปลี่ยนสถานะ)
  const handleCancelWorkSubmission = async () => {
    if (!task?.documentId || !user) return;

    if (!confirm('คุณต้องการยกเลิกการส่งงานหรือไม่?\n\nไฟล์ที่ส่งทั้งหมดจะถูกทำเครื่องหมายว่าถูกยกเลิกแล้ว')) return;

    try {
      setUpdating(true);

      console.log(`Canceling submissions for task: ${taskDocumentId}`);
      
      // หา submission ที่ active อยู่ของผู้ใช้คนนี้
      const activeSubmissions = submissions.filter(
        s => s.is_active && s.submitted_by_user_id_number === user.id
      );

      if (activeSubmissions.length === 0) {
        alert('ไม่พบการส่งงานที่ active');
        return;
      }

      // อัปเดตทุก submission ที่ active ให้เป็น is_active = false
      for (const submission of activeSubmissions) {
        if (!submission.documentId) {
          console.error('Missing documentId for submission:', submission);
          continue;
        }

        console.log('Setting is_active = false for submission:', submission.documentId);
        
        const cancelledAt = new Date().toISOString();
        await axios.put(`/api/submissions/${submission.documentId}`, {
          is_active: false,
          cancelled_at: cancelledAt
        });
      }

      console.log('All active submissions set to inactive');

      // เปลี่ยนสถานะ task เป็น "not turn in"
      const response = await axios.put(`/api/tasks/${task.documentId}`, {
        task_status: 'not turn in'
      });

      if (response.data.success) {
        setTask(prev => prev ? { ...prev, task_status: 'not turn in' } : null);
        
        // รีเฟรช submissions
        await refreshSubmissions();
        
        alert('ยกเลิกการส่งงานเรียบร้อยแล้ว');
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
  const { getTaskStatusConfig } = require('../../../../../utils/taskStatusColors');
  
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
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
              onClick={() => router.push(`/main_pages/projects/${projectId}`)}
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบ Task</h2>
          <p className="text-gray-600 mb-6">Task ที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
          <button 
            onClick={() => router.push(`/main_pages/projects/${projectId}`)}
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
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex flex-row justify-center items-start">
        {/* Main Content */}
        <div className="flex-1 p-6 max-w-[1900px]">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-gray-600 mb-6">
            <a href="/overview" className="hover:text-blue-600">Home</a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <a 
              href={`/main_pages/projects/${projectId}`} 
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
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">ไฟล์งาน</h2>
                </div>

                {/* Drag & Drop Zone - แสดงเฉพาะคนที่ได้รับมอบหมาย และยังไม่ได้ส่งงาน */}
                {user && task.assigned_to_user_ids_number === user.id && (task.task_status === 'not turn in' || task.task_status === 'rejected') && (
                  <label className="mb-4 block cursor-pointer group">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      onChange={handleFileSelectFromInput}
                      multiple
                    />
                    <div
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        {/* Icon with gradient */}
                        <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 ${
                          isDragging 
                            ? 'bg-blue-500 shadow-lg' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200'
                        }`}>
                          <svg 
                            className={`w-7 h-7 transition-colors ${
                              isDragging ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>

                        <h3 className={`text-base font-semibold mb-2 transition-colors ${
                          isDragging 
                            ? 'text-blue-700' 
                            : 'text-gray-700 group-hover:text-blue-600'
                        }`}>
                          {isDragging ? '✨ วางไฟล์ที่นี่' : 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่'}
                        </h3>
                        
                        {/* File type badges */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">PDF</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">DOC</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">DOCX</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">JPG</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">PNG</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">ZIP</span>
                        </div>
                        
                        <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                          สูงสุด 50MB ต่อไฟล์ • รองรับหลายไฟล์พร้อมกัน
                        </p>
                      </div>
                    </div>
                  </label>
                )}

                {/* Selected Files Preview - Compact View */}
                {selectedFiles.length > 0 && !showFileManagementModal && (
                  <div className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-blue-900">
                            ไฟล์ที่เลือก: {selectedFiles.length} ไฟล์
                          </h3>
                          <p className="text-xs text-blue-700 mt-0.5">
                            ขนาดรวม: {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelSubmission}
                        className="flex items-center space-x-2 text-sm text-red-600 hover:text-white hover:bg-red-600 font-semibold px-4 py-2 rounded-lg border-2 border-red-600 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>ลบทั้งหมด</span>
                      </button>
                    </div>

                    {/* File List Preview - Grid Layout */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 ${selectedFiles.length > 6 ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="group relative bg-white border-2 border-blue-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all">
                          <div className="flex items-start space-x-3">
                            {/* File Icon */}
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              {file.type.includes('image') ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            
                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="text-sm font-semibold text-gray-900 truncate" title={fileNames[index] || file.name}>
                                    {fileNames[index] ? (
                                      <>
                                        <span className="text-green-600 mr-1">✓</span>
                                        {fileNames[index]}
                                      </>
                                    ) : (
                                      file.name
                                    )}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <span className="text-xs text-gray-500 truncate">
                                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Delete Button */}
                                <button
                                  onClick={() => handleRemoveSelectedFile(index)}
                                  className="flex-shrink-0 p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all opacity-70 group-hover:opacity-100"
                                  title="ลบไฟล์นี้"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-blue-200">
                      <div className="flex items-center space-x-2 text-xs text-blue-700">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">คลิกปุ่มด้านล่างเพื่อจัดการชื่อไฟล์ก่อนส่งงาน</span>
                      </div>
                      <button
                        onClick={() => setShowFileManagementModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-bold transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>จัดการชื่อไฟล์</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* File Management Modal */}
                {showFileManagementModal && selectedFiles.length > 0 && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">ไฟล์ที่เลือก</h3>
                            <p className="text-sm text-gray-500">{selectedFiles.length} ไฟล์ • รวม {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowFileManagementModal(false);
                            setEditingFileIndex(null);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="ปิด"
                        >
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Modal Body - File List */}
                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-3">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-all">
                              {/* File Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        #{index + 1}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {file.type || 'Unknown type'}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                      ชื่อไฟล์ต้นฉบับ: {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      ขนาด: {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveSelectedFile(index)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                  title="ลบไฟล์นี้"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {/* File Rename Section */}
                              <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                  ตั้งชื่อไฟล์ใหม่ (ไม่บังคับ)
                                </label>
                                {editingFileIndex === index ? (
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={fileNames[index] || ''}
                                        onChange={(e) => {
                                          handleRenameFile(index, e.target.value);
                                          // Clear error when typing
                                          setFileNameErrors(prev => {
                                            const updated = { ...prev };
                                            delete updated[index];
                                            return updated;
                                          });
                                        }}
                                        onBlur={() => {
                                          // Validate on blur
                                          const currentName = fileNames[index];
                                          if (currentName && currentName.trim()) {
                                            const validation = validateFileName(currentName);
                                            if (!validation.isValid) {
                                              setFileNameErrors(prev => ({
                                                ...prev,
                                                [index]: validation.message || 'ชื่อไฟล์ไม่ถูกต้อง'
                                              }));
                                            }
                                          }
                                          setEditingFileIndex(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const currentName = fileNames[index];
                                            if (currentName && currentName.trim()) {
                                              const validation = validateFileName(currentName);
                                              if (!validation.isValid) {
                                                setFileNameErrors(prev => ({
                                                  ...prev,
                                                  [index]: validation.message || 'ชื่อไฟล์ไม่ถูกต้อง'
                                                }));
                                              } else {
                                                setEditingFileIndex(null);
                                              }
                                            } else {
                                              setEditingFileIndex(null);
                                            }
                                          }
                                          if (e.key === 'Escape') {
                                            handleRenameFile(index, '');
                                            setFileNameErrors(prev => {
                                              const updated = { ...prev };
                                              delete updated[index];
                                              return updated;
                                            });
                                            setEditingFileIndex(null);
                                          }
                                        }}
                                        className="w-full px-4 py-2.5 border-2 border-blue-500 rounded-lg text-sm font-medium bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="ใส่ชื่อไฟล์ใหม่..."
                                        autoFocus
                                      />
                                      <div className="absolute right-3 top-2.5 flex items-center space-x-1">
                                        <span className="text-xs text-gray-400">Enter เพื่อบันทึก</span>
                                      </div>
                                    </div>
                                    {fileNameErrors[index] && (
                                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium">{fileNameErrors[index]}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setEditingFileIndex(index)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-left hover:bg-gray-50 hover:border-blue-300 transition-all flex items-center justify-between group"
                                  >
                                    <span className="text-gray-700 font-medium truncate">
                                      {fileNames[index] ? (
                                        <span className="text-blue-700">{fileNames[index]}</span>
                                      ) : (
                                        <span className="text-gray-400">คลิกเพื่อตั้งชื่อไฟล์...</span>
                                      )}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>คลิกปุ่มด้านบนเพื่อตั้งชื่อไฟล์ใหม่</span>
                          </div>
                          <button
                            onClick={() => {
                              // Validate all file names before closing
                              let hasError = false;
                              const errors: { [key: number]: string } = {};
                              
                              Object.keys(fileNames).forEach(indexStr => {
                                const index = parseInt(indexStr);
                                const fileName = fileNames[index];
                                if (fileName && fileName.trim()) {
                                  const validation = validateFileName(fileName);
                                  if (!validation.isValid) {
                                    errors[index] = validation.message || 'ชื่อไฟล์ไม่ถูกต้อง';
                                    hasError = true;
                                  }
                                }
                              });

                              if (hasError) {
                                setFileNameErrors(errors);
                                alert('กรุณาแก้ไขชื่อไฟล์ที่ไม่ถูกต้องก่อนดำเนินการต่อ');
                              } else {
                                // Close modal and keep files
                                setShowFileManagementModal(false);
                                setEditingFileIndex(null);
                              }
                            }}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm flex items-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>เสร็จสิ้น</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files List - แสดงเฉพาะเมื่อมีไฟล์ที่อัปโหลดแล้ว */}
                <div className="space-y-3">
                  {submissions.filter(s => s.file_urls && s.file_urls.length > 0 && s.is_active).length > 0 && (
                    submissions.filter(s => s.file_urls && s.file_urls.length > 0 && s.is_active).map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                ไฟล์แนบ ({submission.file_urls?.length || 0} ไฟล์)
                              </p>
                              <p className="text-sm text-gray-500">
                                อัปโหลดโดย {submission.submittedByUser?.username} • {formatDateTime(submission.submission_date)}
                              </p>
                            </div>
                          </div>
                          {user && submission.submitted_by_user_id_number === user.id && (task.task_status === 'not turn in' || task.task_status === 'rejected') && (
                            <button 
                              onClick={() => handleDeleteFile(submission.id, submission.documentId)}
                              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
                              title="ลบการส่งงานนี้"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                        
                        {/* File List */}
                        <div className="space-y-2 mt-2">
                          {submission.file_urls?.map((fileUrl, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-sm text-gray-700 truncate">
                                  {fileUrl.split('/').pop()}
                                </span>
                              </div>
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors flex-shrink-0"
                              >
                                ดาวน์โหลด
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task Comment Section - แสดงเสมอเมื่ออยู่ในโหมดส่งงาน */}
              {user && task.assigned_to_user_ids_number === user.id && (task.task_status === 'not turn in' || task.task_status === 'rejected') && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h2 className="text-lg font-semibold text-gray-900">ความเห็น / หมายเหตุ</h2>
                    </div>
                    {taskComment && (
                      <span className="text-xs text-gray-500">
                        {taskComment.length} ตัวอักษร
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <textarea
                      value={taskComment}
                      onChange={(e) => {
                        setTaskComment(e.target.value);
                        // Auto-resize based on content
                        const lines = e.target.value.split('\n').length;
                        const textLength = e.target.value.length;
                        // Start with 5 rows if empty or has content, expand up to 200 lines
                        e.target.rows = textLength === 0 ? 5 : Math.max(5, Math.min(lines, 200));
                      }}
                      rows={taskComment.length === 0 ? 5 : Math.max(5, Math.min(taskComment.split('\n').length, 200))}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none ${
                        taskComment.split('\n').length > 200 ? 'overflow-y-auto' : ''
                      }`}
                      placeholder="เขียนความเห็นหรือคำอธิบายสำหรับการส่งงานนี้ เช่น รายละเอียดงาน คำอธิบายเนื้อหา สิ่งที่ต้องการแจ้ง ฯลฯ"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxHeight: taskComment.split('\n').length > 200 ? '4800px' : 'none'
                      }}
                    />
                    
                  </div>
                </div>
              )}

              {/* History Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">ประวัติการส่งงาน</h2>
                    <span className="text-sm text-gray-500">({submissions.length} รายการ)</span>
                  </div>
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
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">ยังไม่มีประวัติการส่งงาน</p>
                    <p className="text-gray-400 text-sm mt-1">ประวัติจะแสดงที่นี่เมื่อมีการส่งงาน</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {[...submissions].reverse().map((submission, index) => (
                      <div 
                        key={submission.id} 
                        className={`border rounded-lg p-2.5 transition-all hover:shadow-sm ${
                          submission.is_active 
                            ? 'bg-white border-green-200 hover:border-green-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Compact Header - User info, status & number in one line */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {/* Compact Avatar */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              submission.is_active ? 'bg-green-100' : 'bg-gray-200'
                            }`}>
                              <span className={`text-xs font-semibold ${
                                submission.is_active ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {submission.submittedByUser?.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            {/* User name & timestamp in compact format */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-gray-900 text-sm truncate">
                                  {submission.submittedByUser?.username}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 truncate">
                                  {formatDateTime(submission.submission_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status badge & number combined */}
                          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                            {submission.is_active ? (
                              <span className="inline-flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>ส่งแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>ยกเลิก</span>
                              </span>
                            )}
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                              #{submissions.length - index}
                            </span>
                          </div>
                        </div>
                        
                        {/* Compact Files - horizontal scroll for multiple files */}
                        {submission.file_urls && submission.file_urls.length > 0 && (
                          <div className="mb-1.5">
                            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                              {submission.file_urls.map((fileUrl, idx) => (
                                <div 
                                  key={idx} 
                                  className={`flex items-center space-x-1.5 px-2 py-1 rounded flex-shrink-0 ${
                                    submission.is_active 
                                      ? 'bg-green-50 border border-green-100' 
                                      : 'bg-gray-100 border border-gray-200'
                                  }`}
                                >
                                  <svg className={`w-3.5 h-3.5 ${
                                    submission.is_active ? 'text-green-600' : 'text-gray-500'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <span className={`text-xs font-medium max-w-[120px] truncate ${
                                    submission.is_active ? 'text-green-700' : 'text-gray-600'
                                  }`}>
                                    {fileUrl.split('/').pop()}
                                  </span>
                                  {submission.is_active && (
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                                    >
                                      Download
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Compact Description with Expand/Collapse */}
                        {submission.submission_description && (() => {
                          const lines = submission.submission_description.split('\n').length;
                          const isLong = lines >= 6 || submission.submission_description.length > 400;
                          
                          return (
                            <div className="bg-blue-50 rounded px-2 py-1.5 border border-blue-100 mb-1.5">
                              <div className="flex items-start space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-blue-800">คำอธิบาย:</p>
                                  <div className="mt-0.5">
                                    <p className={`text-xs text-blue-700 leading-snug whitespace-pre-wrap break-words ${
                                      !expandedDescriptions[submission.id] && isLong
                                        ? 'line-clamp-3' 
                                        : ''
                                    }`}>
                                      {submission.submission_description}
                                    </p>
                                    {isLong && (
                                      <button
                                        onClick={() => setExpandedDescriptions(prev => ({
                                          ...prev,
                                          [submission.id]: !prev[submission.id]
                                        }))}
                                        className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1 transition-colors"
                                      >
                                        <span>{expandedDescriptions[submission.id] ? 'ย่อ' : 'ดูเพิ่มเติม'}</span>
                                        <svg 
                                          className={`w-3 h-3 transition-transform ${expandedDescriptions[submission.id] ? 'rotate-180' : ''}`} 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Compact Review Comments */}
                        {submission.comments && (submission.comments.includes('✅ อนุมัติ') || submission.comments.includes('❌ ไม่อนุมัติ')) && (
                          <div className={`rounded px-2 py-1.5 border mb-1.5 ${
                            submission.comments.includes('✅ อนุมัติ') 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-start space-x-1.5">
                              {submission.comments.includes('✅ อนุมัติ') ? (
                                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${
                                  submission.comments.includes('✅ อนุมัติ') 
                                    ? 'text-green-800' 
                                    : 'text-red-800'
                                }`}>
                                  {submission.comments.includes('✅ อนุมัติ') ? '✅ อนุมัติ' : '❌ ไม่อนุมัติ'}
                                </p>
                                <p className={`text-xs leading-snug whitespace-pre-wrap break-words mt-0.5 ${
                                  submission.comments.includes('✅ อนุมัติ') 
                                    ? 'text-green-700' 
                                    : 'text-red-700'
                                }`}>
                                  {submission.comments.split(':').slice(1).join(':').trim() || 'ไม่มีความคิดเห็น'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Compact Cancellation Info */}
                        {!submission.is_active && submission.cancelled_at && (
                          <div className="bg-red-50 rounded px-2 py-1.5 border border-red-200">
                            <div className="flex items-start space-x-1.5">
                              <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-red-800">❌ ยกเลิกการส่งงาน</p>
                                <p className="text-xs text-red-700 leading-snug mt-0.5">
                                  {formatDateTime(submission.cancelled_at)}
                                </p>
                              </div>
                            </div>
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
                      onClick={() => window.location.href = `/main_pages/projects/${projectId}`}
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
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">สถานะ</span>
                    <div className={`flex items-center space-x-2 px-3 py-1.5 ${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg`}>
                      <div className={`w-2 h-2 rounded-full ${statusConfig.indicatorColor}`}></div>
                      <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                        {statusConfig.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Assigned User */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">ผู้รับผิดชอบ</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-medium">
                          {assignedUser ? assignedUser.username.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {assignedUser ? assignedUser.username : 'ไม่ได้กำหนด'}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">กำหนดส่ง</span>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-900">{formatDate(task.due_date)}</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">อัปเดตล่าสุด</span>
                    <span className="text-sm text-gray-900">{formatDate(task.updatedAt)}</span>
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
                      <label className="block text-sm font-medium text-black-500 mb-2">เวลาที่เหลือ</label>
                      {timeLeft.isOverdue ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700 font-medium text-sm">เลยกำหนดส่งแล้ว</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <div className="text-xl font-bold text-gray-900">{timeLeft.days}</div>
                              <div className="text-xs text-gray-500">วัน</div>
                            </div>
                            <div className="text-gray-400">:</div>
                            <div className="flex items-center space-x-1">
                              <div className="text-xl font-bold text-gray-900">{String(timeLeft.hours).padStart(2, '0')}</div>
                              <div className="text-xs text-gray-500">ชม.</div>
                            </div>
                            <div className="text-gray-400">:</div>
                            <div className="flex items-center space-x-1">
                              <div className="text-xl font-bold text-gray-900">{String(timeLeft.minutes).padStart(2, '0')}</div>
                              <div className="text-xs text-gray-500">นาที</div>
                            </div>
                            <div className="text-gray-400">:</div>
                            <div className="flex items-center space-x-1">
                              <div className="text-xl font-bold text-gray-900">{String(timeLeft.seconds).padStart(2, '0')}</div>
                              <div className="text-xs text-gray-500">วินาที.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {task.task_status === 'turn in' || task.task_status === 'pending_review' || task.task_status === 'completed' ? (
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
                    ) : (
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
                            <span>
                              {selectedFiles.length > 0 
                                ? `ส่งงาน (${selectedFiles.length} ไฟล์)` 
                                : 'ส่งงาน'}
                            </span>
                          </>
                        )}
                      </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>
                    ความคิดเห็น {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    {reviewComment.length} / 1000 ตัวอักษร
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    value={reviewComment}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setReviewComment(e.target.value);
                      }
                    }}
                    rows={6}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y min-h-[120px] max-h-[300px]"
                    placeholder={reviewAction === 'approve' 
                      ? 'เขียนความคิดเห็นเพิ่มเติม เช่น จุดเด่น ข้อควรปรับปรุง คำแนะนำ (ไม่บังคับ)' 
                      : 'กรุณาระบุเหตุผลที่ไม่อนุมัติ เช่น งานไม่ตรงตามที่กำหนด, คุณภาพไม่เป็นไปตามมาตรฐาน, ต้องการแก้ไขส่วนใด (บังคับ)'
                    }
                    disabled={reviewLoading}
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  />
                  {reviewComment.length >= 950 && (
                    <div className="absolute bottom-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                      เหลืออีก {1000 - reviewComment.length} ตัวอักษร
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-start space-x-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ความคิดเห็นของคุณจะถูกบันทึกในประวัติการส่งงานและสมาชิกที่เกี่ยวข้องจะได้รับการแจ้งเตือน</span>
                </div>
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

      {/* Submit Work Modal - Enhanced */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">ยืนยันการส่งงาน</h3>
                  <p className="text-sm text-gray-600">กรุณาตรวจสอบข้อมูลก่อนส่ง</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                disabled={submitting}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Task Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Task</p>
                    <p className="text-base font-semibold text-blue-800">{task.task_name}</p>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Zone for File Selection */}
              <div className="mb-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3">เพิ่มไฟล์ (ถ้ามี)</h4>
                <label className="block cursor-pointer group">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    onChange={handleFileSelectFromInput}
                    multiple
                    disabled={submitting}
                  />
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                        : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      {/* Icon with gradient */}
                      <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 ${
                        isDragging 
                          ? 'bg-blue-500 shadow-lg' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200'
                      }`}>
                        <svg 
                          className={`w-7 h-7 transition-colors ${
                            isDragging ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>

                      <h3 className={`text-base font-semibold mb-2 transition-colors ${
                        isDragging 
                          ? 'text-blue-700' 
                          : 'text-gray-700 group-hover:text-blue-600'
                      }`}>
                        {isDragging ? '✨ วางไฟล์ที่นี่' : 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่'}
                      </h3>
                      
                      {/* File type badges */}
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">PDF</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">DOC</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">DOCX</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">JPG</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">PNG</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">ZIP</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                        สูงสุด 50MB ต่อไฟล์ • รองรับหลายไฟล์พร้อมกัน
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Files Section */}
              {selectedFiles.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>ไฟล์ที่จะส่ง</span>
                    </h4>
                    <span className="text-sm text-gray-500">
                      {selectedFiles.length} ไฟล์ • {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">{file.type || 'Unknown'}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileNames[index] || file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              ขนาด: {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>ความเห็น / หมายเหตุ</span>
                  </h4>
                  <span className="text-xs text-gray-500">
                    {taskComment.length} ตัวอักษร
                  </span>
                </div>
                <textarea
                  value={taskComment}
                  onChange={(e) => setTaskComment(e.target.value)}
                  placeholder="เพิ่มความเห็นหรือหมายเหตุเกี่ยวกับงานที่ส่ง (ไม่บังคับ)"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-700 placeholder-gray-400"
                  style={{ 
                    lineHeight: '1.5',
                    fontFamily: 'inherit'
                  }}
                />
                
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFiles.length > 0 ? (
                    <span>กำลังส่ง <strong className="text-gray-900">{selectedFiles.length} ไฟล์</strong></span>
                  ) : (
                    <span>ส่งงาน<strong className="text-gray-900">โดยไม่มีไฟล์</strong></span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-200 rounded-lg transition-all"
                    disabled={submitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
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
          </div>
        </div>
      )}

    </div>
  );
}
