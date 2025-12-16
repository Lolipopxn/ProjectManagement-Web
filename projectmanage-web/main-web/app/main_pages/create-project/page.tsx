'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from 'crypto';
import { IoMdArrowRoundBack, IoMdAdd } from "react-icons/io";
import { MdOutlinePostAdd } from "react-icons/md";
import { FaAngleDoubleRight, FaAngleDoubleLeft  } from "react-icons/fa";

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
  const [myId, setMyId] = useState<User | null>(null);
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
  const [ isAddUser, setAddUser ] = useState(false);

  const MEMBERS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil((projectMembers.length) / MEMBERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const currentMembers = projectMembers.slice(startIndex, startIndex + MEMBERS_PER_PAGE);

  // ตรวจสอบ authentication เมื่อ component โหลด
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        console.log('User authenticated:', response.data.user); // Debug log
        setCurrentUserId(response.data.user.id); // เก็บ user ID ของผู้สร้าง
        setMyId(response.data.user);
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

  useEffect(() => {
    if (isAddUser) {
      addMember();
    }
  }, [isAddUser]);

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
      setAddUser(false);
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
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

      // console.log('Response status:', response.status); // Debug log
      // console.log('Response data:', response.data); // Debug log
      // console.log('Project creation summary:', {
      //   projectName: formData.project_name,
      //   totalMembers: projectMembers.length + 1,
      //   memberRoles: [
      //     { userId: currentUserId, role: 'Leader', isCreator: true },
      //     ...projectMembers.map(m => ({ userId: m.userId, role: m.roleInProject, isCreator: false }))
      //   ],
      //   dateRange: `${formData.start_date} to ${formData.end_date}`,
      //   status: formData.project_status
      // });

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
          router.push(`/main_pages/projects/${createdProjectDocumentId}`);
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
    <div className="min-h-screen w-full bg-white flex justify-center">   
      <div className='flex-1 max-w-[1900px]'>
        {/* Main Content */}
          <div className="flex flex-row justify-center px-8 py-8">
            <div className='flex-1 md:pl-10 md:pr-20'>
              {/* Header */}
              <div className="mb-2 flex flex-row items-center space-x-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <button 
                    onClick={() => router.back()}
                    className="hover:text-[#50589C] transition-colors"
                  >
                    <IoMdArrowRoundBack className='size-6'/>
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="flex gap-6 flex-col py-2 md:flex-row">
                {/* Project Information Card - Left Side */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-2">
                    <div className="mb-6 flex flex-row items-center space-x-4 bg-[#50589C] py-2 pl-5 rounded-full">
                      <MdOutlinePostAdd className='size-7 text-white'/>
                      <h2 className="text-xl font-semibold text-white">เพิ่มโปรเจ็กต์</h2>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#50589C] focus:border-[#50589C]"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#50589C] focus:border-[#50589C]"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#50589C] focus:border-[#50589C]"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#50589C] focus:border-[#50589C]"
                          />
                        </div>
                      </div>

                      {/* Project Status */}
                      {/* <div>
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
                      </div> */}

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
                      <div className="flex space-x-6 pt-4">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-[#50589C] text-white py-2 px-4 rounded-md hover:bg-[#50589C]/80 focus:outline-none focus:ring-2 focus:ring-[#50589C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? 'กำลังสร้าง...' : 'สร้างโปรเจ็กต์'}
                        </button>  
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Members Card - Right Side */}
              <div className=" w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">สมาชิกโปรเจ็กต์</h2>
                    <p className="text-sm text-gray-600">เพิ่มสมาชิกเข้าร่วมโปรเจ็กต์ (คุณจะเป็นหัวหน้าโปรเจ็กต์อัตโนมัติ)</p>
                  </div>

                  {/* User Search Dropdown */}
                  <div className="mb-4 relative">
                    <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
                      ค้นหาเพื่อเพิ่มสมาชิก
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#50589C] focus:border-[#50589C]"
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
                                setAddUser(true);
                              }}
                              className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#A7AAE1] transition-colors"
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
                              <div>
                                <IoMdAdd className='size-5'/>
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
                  {/* <div className="mb-4">
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
                  </div> */}
                  <div className='rounded-lg p-3 bg-gray-100 h-90'>                   
                    <div className='flex flex-row items-center, justify-between'>
                      <h3 className="text-md font-medium text-black mb-3">สมาชิก</h3>
                       <div className='text-black text-md'>{projectMembers.length + 1} คน</div>
                    </div>
                    <div className='h-65'>
                      <div className={`${currentPage > 1 ? 'hidden' : 'flex'} flex items-center justify-between py-2 px-3 bg-white rounded-md mb-2`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#636CCB] rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#3C467B]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{myId?.username}</div>
                              <div className="text-sm text-[#636CCB]">Leader</div>
                            </div>
                          </div>  
                        </div>
                      {/* Current Project Members */}
                      {projectMembers.length > 0 && (
                        <div className="mb-6">
                          <div className="space-y-2">
                            {currentMembers.map((member) => (
                              <div key={member.userId} className="flex items-center justify-between py-2 px-3 bg-white rounded-md">
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

                                <div className='flex flex-row items-center gap-1'>
                                  <button
                                    type="button"
                                    onClick={() => removeMember(member.userId)}
                                    className="text-red-600 hover:text-red-800 p-1 transition-colors"
                                    title="ลบสมาชิก"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
            
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 mt-4">
                        {/* Previous */}
                        <button
                          className="px-3 py-1 bg-[#6E8CFB] text-white rounded disabled:opacity-40"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                          <FaAngleDoubleLeft />
                        </button>

                        {/* Page Numbers */}
                          <div className="flex gap-2 text-sm">         
                            {currentPage} / {`${totalPages < 1 ? '1' : totalPages}`}
                          </div>

                          {/* Next */}
                          <button
                            className="px-3 py-1 bg-[#6E8CFB] text-white rounded disabled:opacity-40"
                            disabled={currentPage === totalPages || totalPages === 0 }
                            onClick={() => setCurrentPage(prev => prev + 1)}
                          >                       
                            <FaAngleDoubleRight />
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
