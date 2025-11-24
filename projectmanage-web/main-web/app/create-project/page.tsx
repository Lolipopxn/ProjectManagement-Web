'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../components/Nabbar_main/Navbar';
import Sidebar from '../components/Sidebar';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from 'crypto';

// โปรเจ็กต์นี้ใช้ field created_by_user แทน relation เพื่อเก็บ user ID ของผู้สร้าง
// สำหรับ project members ใช้ field ใหม่ project_idnumber และ user_id_in_project แทน relations


interface ProjectFormData {
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  slug: string;
}

interface ProjectMember {
  userId: number;
  roleInProject: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    project_status: 'active',
    slug: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // ตรวจสอบ authentication เมื่อ component โหลด
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        console.log('User authenticated:', response.data.user); // Debug log
        setCurrentUserId(response.data.user.id); // เก็บ user ID ของผู้สร้าง
        setIsCheckingAuth(false);
      } catch (error: any) {
        console.log('No authentication found, redirecting to login'); // Debug log
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // ดึงรายการผู้ใช้หลังจากได้ currentUserId แล้ว
  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // ฟังก์ชันสำหรับดึงรายการผู้ใช้ (ไม่รวมตัวเอง)
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      const allUsers = response.data.users || [];
      
      // กรองผู้ใช้ ไม่แสดงตัวเองในรายชื่อ
      const filteredUsers = allUsers.filter((user: User) => user.id !== currentUserId);
      setUsers(filteredUsers);
      
      console.log('Loaded users (excluding self):', filteredUsers.length);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  // ฟังก์ชันสำหรับเพิ่มสมาชิกในรายการ
  const addMember = () => {
    if (selectedUserId && selectedRole) {
      // ตรวจสอบว่าไม่ใช่ตัวเอง
      if (selectedUserId === currentUserId) {
        setError('คุณไม่สามารถเพิ่มตัวเองเป็นสมาชิกได้ เนื่องจากคุณเป็นหัวหน้าโปรเจ็กต์อยู่แล้ว');
        return;
      }

      // ตรวจสอบว่าไม่ได้เป็นสมาชิกอยู่แล้ว
      const isAlreadyAdded = projectMembers.some(member => member.userId === selectedUserId);
      if (isAlreadyAdded) {
        setError('ผู้ใช้นี้เป็นสมาชิกของโปรเจ็กต์แล้ว');
        return;
      }

      setProjectMembers([...projectMembers, {
        userId: selectedUserId as number,
        roleInProject: selectedRole
      }]);
      setSelectedUserId('');
      setSearchTerm('');
      setShowDropdown(false);
      setError('');
    } else {
      setError('กรุณาเลือกผู้ใช้และกำหนดบทบาท');
    }
  };

  // ฟังก์ชันสำหรับลบสมาชิกจากรายการ
  const removeMember = (userId: number) => {
    const isInProject = projectMembers.some(member => member.userId === userId);
    if (!isInProject) {
      setError('ผู้ใช้นี้ไม่ได้เป็นสมาชิกของโปรเจ็กต์');
      return;
    }
    
    setProjectMembers(projectMembers.filter(member => member.userId !== userId));
    setError('');
  };

  // ฟังก์ชันสำหรับหาชื่อผู้ใช้จาก ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  // ฟังก์ชันสำหรับแปลงวันที่ให้อ่านง่าย
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // ฟังก์ชันกรองผู้ใช้ตามคำค้นหา
  const filteredUsers = users.filter(user => 
    user.id !== currentUserId && // กรองตัวเองออก
    !projectMembers.some(member => member.userId === user.id) && // กรองสมาชิกที่เพิ่มแล้วออก
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // แสดง loading ถ้ายังตรวจสอบ auth อยู่
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!formData.project_name.trim()) {
      setError('กรุณากรอกชื่อโปรเจ็กต์');
      setIsLoading(false);
      return;
    }
    
    if (!formData.description.trim()) {
      setError('กรุณากรอกคำอธิบายโปรเจ็กต์');
      setIsLoading(false);
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      setIsLoading(false);
      return;
    }

    // ตรวจสอบว่าวันที่สิ้นสุดมาหลังวันที่เริ่มต้น
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น');
      setIsLoading(false);
      return;
    }

    try {
      // สร้าง slug และเตรียมข้อมูลสำหรับโปรเจ็กต์
      const projectSlug = uuidv4();
      const currentDateTime = new Date().toISOString();

      // ส่งข้อมูลไปยัง API route พร้อมข้อมูลครบถ้วน
      const response = await axios.post('/api/projects/create', {
        project_name: formData.project_name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        project_status: formData.project_status,
        slug: projectSlug,
        created_by_user_id: currentUserId, // เพิ่ม user ID ของผู้สร้าง
        created_by_user: currentUserId, // เพิ่มฟิลด์สำรอง
        createdAt: currentDateTime,
        updatedAt: currentDateTime,
        publishedAt: currentDateTime,
        // เพิ่มข้อมูล metadata
        metadata: {
          totalMembers: projectMembers.length + 1, // รวมผู้สร้างด้วย
          membersList: [
            {
              userId: currentUserId,
              role: 'Leader',
              isCreator: true
            },
            ...projectMembers.map(member => ({
              userId: member.userId,
              role: member.roleInProject,
              isCreator: false
            }))
          ]
        }
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response data:', response.data); // Debug log
      console.log('Project creation summary:', {
        projectName: formData.project_name,
        totalMembers: projectMembers.length + 1,
        memberRoles: [
          { userId: currentUserId, role: 'Leader', isCreator: true },
          ...projectMembers.map(m => ({ userId: m.userId, role: m.roleInProject, isCreator: false }))
        ],
        dateRange: `${formData.start_date} to ${formData.end_date}`,
        status: formData.project_status
      });

      if (response.status === 200) {
        // ใน Strapi v5 ใช้ documentId แทน id
        const createdProjectDocumentId = response.data.project?.data?.documentId;
        const createdProjectId = response.data.project?.data?.id; // เก็บ id ไว้สำหรับ project_members
        
        console.log('Project creation response data:', {
          fullResponse: response.data,
          documentId: createdProjectDocumentId,
          numericId: createdProjectId,
          currentUserId: currentUserId
        });
        
        if (createdProjectDocumentId && currentUserId) {
          try {
            console.log(`Adding project creator as leader: ${currentUserId}`);
            console.log('Project data for creator:', {
              project_id_number: createdProjectId,
              user_id_in_project: currentUserId,
              project_document_id: createdProjectDocumentId
            });
            
            // เพิ่มผู้สร้างโปรเจ็กต์เป็นหัวหน้าโปรเจ็กต์ก่อน
            // ส่งข้อมูลตาม project-member schema ที่ถูกต้อง
            const creatorMemberData = {
              role_in_project: 'Leader', // string, required
              join_date: currentDateTime, // datetime, required
              project_id_number: createdProjectId, // integer, required
              user_id_in_project: currentUserId, // integer, required
              project_document_id: createdProjectDocumentId // string, required
              // role enumeration และ relations จะถูกจัดการใน API route
            };
            
            console.log('Creator member data to send:', JSON.stringify(creatorMemberData, null, 2));
            
            // Validate data before sending
            if (!creatorMemberData.project_id_number || !creatorMemberData.user_id_in_project || 
                !creatorMemberData.role_in_project || !creatorMemberData.project_document_id) {
              throw new Error(`Missing required fields in creator data: ${JSON.stringify({
                project_id_number: !!creatorMemberData.project_id_number,
                user_id_in_project: !!creatorMemberData.user_id_in_project,
                role_in_project: !!creatorMemberData.role_in_project,
                project_document_id: !!creatorMemberData.project_document_id
              })}`);
            }
            
            const creatorResponse = await axios.post('/api/project-members', creatorMemberData);
            
            console.log('Successfully added project creator as leader:', creatorResponse.data);
            
            // เพิ่มสมาชิกอื่นๆ (ถ้ามี)
            if (projectMembers.length > 0) {
              console.log(`Adding ${projectMembers.length} additional members to project ${createdProjectId}`);
              
              for (const member of projectMembers) {
                try {
                  // เตรียมข้อมูลสมาชิกตาม schema ที่ถูกต้อง
                  const memberData = {
                    role_in_project: member.roleInProject, // string, required  
                    join_date: currentDateTime, // datetime, required
                    project_id_number: createdProjectId, // integer, required
                    user_id_in_project: member.userId, // integer, required
                    project_document_id: createdProjectDocumentId // string, required
                    // role enumeration และ relations จะถูกจัดการใน API route
                  };
                  
                  console.log(`Attempting to add member:`, memberData);
                  
                  const memberResponse = await axios.post('/api/project-members', memberData);
                  
                  console.log(`Successfully added member ${member.userId}:`, memberResponse.data);
                } catch (memberError: any) {
                  console.error(`Failed to add member ${member.userId}:`, {
                    error: memberError.message,
                    status: memberError.response?.status,
                    data: memberError.response?.data
                  });
                  
                  // ยังคงดำเนินการต่อแม้จะเพิ่มสมาชิกคนหนึ่งไม่ได้
                }
              }
            }
            
            console.log('Finished processing all project members');
            console.log('Project creation completed successfully:', {
              projectId: createdProjectId,
              documentId: createdProjectDocumentId,
              totalMembersAdded: projectMembers.length + 1,
              creatorAdded: true,
              additionalMembersAdded: projectMembers.length
            });
          } catch (memberError: any) {
            console.error('Error in member processing:', {
              error: memberError.message,
              status: memberError.response?.status,
              data: memberError.response?.data,
              url: memberError.config?.url
            });
            
            // แสดง error ให้ผู้ใช้เห็นว่าไม่สามารถเพิ่มสมาชิกได้
            if (memberError.response?.status === 404) {
              setError('โปรเจคสร้างสำเร็จแล้ว แต่ไม่สามารถเพิ่มสมาชิกได้ เนื่องจากไม่พบ API endpoint สำหรับเพิ่มสมาชิก');
            } else {
              setError(`โปรเจคสร้างสำเร็จแล้ว แต่เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ${memberError.response?.data?.message || memberError.message}`);
            }
            // ไม่ให้ error นี้หยุดการสร้างโปรเจ็กต์
          }
        }

        // แสดงข้อความสำเร็จพร้อมสรุปข้อมูล
        const totalMembers = projectMembers.length + 1; // รวมผู้สร้างด้วย
        const successMessage = `สร้างโปรเจ็กต์ "${formData.project_name}" สำเร็จแล้ว! 
          รวมสมาชิก ${totalMembers} คน 
          คุณเป็น Project Leader 
          สถานะ: ${formData.project_status}
          ระยะเวลา: ${formatDate(formData.start_date)} - ${formatDate(formData.end_date)}
        กำลังนำคุณไปหน้าโปรเจ็กต์...`;
        
        setSuccess(successMessage);
        
        // รอ 3 วินาทีแล้วไปหน้าโปรเจ็กต์ที่สร้าง (ใช้ documentId)
        setTimeout(() => {
          router.push(`/projects/${createdProjectDocumentId}`);
        }, 3000);
      } else {
        setError('ไม่สามารถสร้างโปรเจ็กต์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response?.data); // Debug log
      
      // ตรวจสอบว่าเป็น error เรื่อง authentication หรือไม่
      if (error.response?.status === 401) {
        console.log('Authentication failed, redirecting to login'); // Debug log
        setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        router.push('/login');
        return;
      }
      
      setError('เกิดข้อผิดพลาดในการสร้างโปรเจ็กต์: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // เคลียร์ error และ success message เมื่อผู้ใช้เปลี่ยนข้อมูล
    if (error) setError('');
    if (success) setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar user={null} />
      
      <div className="flex mt-17">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <button 
                onClick={() => router.back()}
                className="hover:text-blue-600 transition-colors"
              >
                ← กลับ
              </button>
              <span>สร้างโปรเจ็กต์ใหม่</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">สร้างโปรเจ็กต์ใหม่</h1>
          </div>

          {/* Form */}
          <div className="flex gap-6">
            {/* Project Information Card - Left Side */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">ข้อมูลโปรเจ็กต์</h2>
                  <p className="text-sm text-gray-600">กรอกรายละเอียดพื้นฐานของโปรเจ็กต์</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อโปรเจ็กต์ *
                    </label>
                    <input
                      type="text"
                      id="project_name"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="กรอกชื่อโปรเจ็กต์"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบาย *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="อธิบายรายละเอียดของโปรเจ็กต์"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่เริ่มต้น *
                      </label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่สิ้นสุด *
                      </label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Project Status */}
                  <div>
                    <label htmlFor="project_status" className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะโปรเจ็กต์
                    </label>
                    <select
                      id="project_status"
                      name="project_status"
                      value={formData.project_status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">กำลังดำเนินการ</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="on-hold">พักการทำงาน</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-800">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'กำลังสร้าง...' : 'สร้างโปรเจ็กต์'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Project Members Card - Right Side */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">สมาชิกโปรเจ็กต์</h2>
                  <p className="text-sm text-gray-600">เพิ่มสมาชิกเข้าร่วมโปรเจ็กต์ (คุณจะเป็นหัวหน้าโปรเจ็กต์อัตโนมัติ)</p>
                </div>

                {/* User Search Dropdown */}
                <div className="mb-4 relative">
                  <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหาผู้ใช้
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="user-search"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="พิมพ์ชื่อหรืออีเมลเพื่อค้นหาผู้ใช้"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Dropdown */}
                    {showDropdown && searchTerm && filteredUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSearchTerm(user.username);
                              setShowDropdown(false);
                            }}
                            className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results message */}
                    {showDropdown && searchTerm && filteredUsers.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <div className="px-4 py-3 text-gray-500 text-center">
                          ไม่พบผู้ใช้ที่ค้นหา
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Close dropdown when clicking outside */}
                  {showDropdown && (
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowDropdown(false)}
                    />
                  )}
                </div>

                {/* Role Selection */}
                <div className="mb-4">
                  <label htmlFor="selectedRole" className="block text-sm font-medium text-gray-700 mb-2">
                    บทบาทสำหรับสมาชิกใหม่
                  </label>
                  <select
                    id="selectedRole"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="member">สมาชิก</option>
                    <option value="leader">หัวหน้าโปรเจ็กต์</option>
                    <option value="developer">นักพัฒนา</option>
                    <option value="designer">นักออกแบบ</option>
                    <option value="tester">ผู้ทดสอบ</option>
                  </select>
                </div>

                {/* Action Button */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={addMember}
                    disabled={!selectedUserId}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>เพิ่มสมาชิกในโปรเจ็กต์</span>
                  </button>
                </div>

                {/* Current Project Members */}
                {projectMembers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">สมาชิกในโปรเจ็กต์</h3>
                    <div className="space-y-2">
                      {projectMembers.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{getUserName(member.userId)}</div>
                              <div className="text-sm text-green-700">{member.roleInProject}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMember(member.userId)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            title="ลบสมาชิก"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-blue-900">
                      สรุปข้อมูลโปรเจ็กต์
                    </span>
                  </div>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <strong>จำนวนสมาชิก:</strong> {projectMembers.length + 1} คน
                      </div>
                      <div>
                        <strong>สถานะ:</strong> {
                          formData.project_status === 'active' ? 'กำลังดำเนินการ' :
                          formData.project_status === 'completed' ? 'เสร็จสิ้น' :
                          formData.project_status === 'on-hold' ? 'พักการทำงาน' :
                          formData.project_status === 'cancelled' ? 'ยกเลิก' : formData.project_status
                        }
                      </div>
                    </div>
                    
                    {formData.start_date && formData.end_date && (
                      <div>
                        <strong>ระยะเวลา:</strong> {formatDate(formData.start_date)} - {formatDate(formData.end_date)}
                      </div>
                    )}
                    
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="font-medium mb-1">รายชื่อสมาชิก:</div>
                      <div className="space-y-1 text-xs text-blue-700">
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                          <span>คุณ - หัวหน้าโปรเจ็กต์ (ผู้สร้าง)</span>
                        </div>
                        {projectMembers.length > 0 && 
                          projectMembers.map((member, index) => (
                            <div key={member.userId} className="flex items-center space-x-1">
                              <span className={`w-2 h-2 rounded-full ${
                                member.roleInProject.toLowerCase() === 'leader' ? 'bg-purple-400' :
                                member.roleInProject.toLowerCase() === 'developer' ? 'bg-green-400' :
                                member.roleInProject.toLowerCase() === 'designer' ? 'bg-pink-400' :
                                member.roleInProject.toLowerCase() === 'tester' ? 'bg-orange-400' :
                                'bg-gray-400'
                              }`}></span>
                              <span>{getUserName(member.userId)} - {member.roleInProject}</span>
                            </div>
                          ))
                        }
                        {projectMembers.length === 0 && (
                          <div className="text-gray-500 italic">• ยังไม่มีสมาชิกเพิ่มเติม</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
