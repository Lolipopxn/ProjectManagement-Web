'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import dayjs from "dayjs";
import "dayjs/locale/th";
import TaskStatusIcon from '../../../components/TaskStatusIcon';
import CreateTaskModal from '../../../components/CreateTaskModal';
import ProjectChatPopup from "../../../components/ProjectChat";
import VoiceRoomButton from "../../../components/VoiceRoomButton";
import GanttChart from '@/app/components/GanttChart';
import FreeDragBoard from '@/app/components/task_board/freeDragBoard';
import TaskPopup from '@/app/components/taskPopup';
import SkeletonTask from '@/app/components/loading/TaskLoading/skeletonTask';
import SelectLocationMap from '@/app/components/map/SelectLocationMap';
import GoogleMapsProvider from '@/app/components/map/GoogleMapsProvider';
import MemberPopup from '@/app/components/MemberPopup';
import RenderTaskCard from '@/app/components/RenderTaskCard';

import { AiFillReconciliation, AiFillEnvironment, AiFillFileText } from "react-icons/ai";
import { IoMdClose, IoMdPerson } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import { CgSandClock } from "react-icons/cg";
import { FcSurvey, FcOk, FcHighPriority, FcSearch, FcProcess } from "react-icons/fc";
import { GrAnnounce } from "react-icons/gr";


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
  slug: string;
  boards: string[];
  currentBoard: string;
}

// Interface สำหรับ task data จาก Strapi
interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: string;
  due_date: string;
  begin_date: string;
  createdAt: string;
  task_color: string;
  task_type: string;
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
    documentId?: string;
    username: string;
    email?: string;
  };
}

// Interface สำหรับ user data
interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
}

type TaskFilter = "All" | "not turn in" | "pending_review" | "completed" | "late" | "myTask";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [openFilter, setOpenFilter] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Member');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeMemberLoading, setRemoveMemberLoading] = useState<number | string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showTaskManageModal, setShowTaskManageModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [popupTask, setPopupTask] = useState(false);
  const [taskManageLoading, setTaskManageLoading] = useState(false);
  const [showProjectManageModal, setShowProjectManageModal] = useState(false);
  const [projectManageLoading, setProjectManageLoading] = useState(false);
  const [ToggleView, setToggleView] = useState(0);
  const [toggleMember, setToggleMember] = useState(false);
  const [openOptions, setOpenOptions] = useState(false);
  const [reloadTaskMembers, setReloadTaskMembers] = useState(false);

  const [reload, setReload] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const allTasks = [...myTasks, ...otherTasks];
  
  useEffect(() => {
    if (!projectId) return;

    const fetchAllData = async () => {
      setLoading(true);
      setProjectLoading(true);
      setTasksLoading(true);
      setError(null);

      try {
        const [projectRes, userRes] = await Promise.all([
          axios.get(`/api/projects/${projectId}`),
          axios.get(`/api/auth/me`).catch(() => null),
        ]);

        const project = projectRes.data?.project;
        const currentUser = userRes?.data?.user ?? null;
        const jwt = userRes?.data?.token ?? null;
        setToken(jwt);

        if (!project) {
          setError("ไม่พบข้อมูลโปรเจ็กต์");
          return;
        }

        setProject(project);
        setProjectLoading(false);
        setLoading(false);
        if (currentUser) setUser(currentUser);

        setMembersLoading(true);

        let membersWithUserInfo: any[] = [];

        try {
          const membersRes = await axios.get(
            `/api/project-members?projectDocumentId=${projectId}&projectIdNumber=${project.id}`
          );

          if (membersRes.data?.success) {
            const members = membersRes.data.projectMembers ?? [];

            // user info parallel
            membersWithUserInfo = await Promise.all(
              members.map(async (member: any) => {
                try {
                  const userRes = await axios.get(
                    `/api/users?userId=${member.user_id_in_project}`
                  );

                  return {
                    ...member,
                    userInfo: userRes.data?.user ?? null,
                  };
                } catch {
                  return {
                    ...member,
                    userInfo: null,
                  };
                }
              })
            );
          }
        } catch (err) {
          console.error("Fetch members failed:", err);
        } finally {
          setProjectMembers(membersWithUserInfo);
          setMembersLoading(false);
        }

        if (currentUser) {
          const isLeader =
            project.created_by_user_id === currentUser.id ||
            project.created_by_user === currentUser.id;

          if (isLeader) {
            setUserRole("Leader");
          } else {
            const member = membersWithUserInfo.find(
              (m) =>
                (m.userInfo?.id ?? m.user_id_in_project) === currentUser.id
            );

            setUserRole(member?.role_in_project ?? "Member");
          }
        }

        try {
          const tasksRes = await axios.get(
            `/api/tasks?projectDocumentId=${projectId}`
          );

          const tasks = tasksRes.data?.tasks ?? [];
          const currentUserId = currentUser?.id;
          const isMyTask = (task: Task, currentUserId: number) => {
            return Array.isArray(task.assigned_to_user_ids)
              && task.assigned_to_user_ids.some(
                (user: any) => user?.id === currentUserId
              );
          };

          if (!currentUserId) {
            setMyTasks([]);
            setOtherTasks(tasks);
          } else {
            setMyTasks(
              tasks.filter((t: Task) => isMyTask(t, currentUserId))
            );

            setOtherTasks(
              tasks.filter((t: Task) => !isMyTask(t, currentUserId))
            );
          }
          setTasksLoading(false);
        } catch (err) {
          console.error("Fetch tasks failed:", err);
          setMyTasks([]);
          setOtherTasks([]);
          setTasksLoading(false);
        }
      } catch (err: any) {
        console.error(err);

        switch (err?.response?.status) {
          case 401:
            setError("กรุณาเข้าสู่ระบบ");
            break;
          case 403:
            setError("คุณไม่มีสิทธิ์เข้าถึงโปรเจ็กต์นี้");
            break;
          case 404:
            setError("ไม่พบโปรเจ็กต์ที่ระบุ");
            break;
          default:
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        // setLoading(false);
      }
    };

    fetchAllData();
  }, [projectId]);

  //reload data
  useEffect(() => {
    //reload project
    if (reload) {
      const ReloadData = async () => {
        try {
          setError(null);

          // load project
          const projectResponse = await axios.get(`/api/projects/${projectId}`);

          if (projectResponse.data.success && projectResponse.data.project) {
            setProject(projectResponse.data.project);
          }

          // load tasks
          const tasksRes = await axios.get(
            `/api/tasks?projectDocumentId=${projectId}`
          );

          const tasks = tasksRes.data?.tasks ?? [];
          const currentUserId = user?.id;

          const isMyTask = (task: Task, currentUserId: number) => {
            return (
              Array.isArray(task.assigned_to_user_ids) &&
              task.assigned_to_user_ids.some(
                (user: any) => user?.id === currentUserId
              )
            );
          };

          if (!currentUserId) {
            setMyTasks([]);
            setOtherTasks(tasks);
          } else {
            setMyTasks(tasks.filter((t: Task) => isMyTask(t, currentUserId)));
            setOtherTasks(tasks.filter((t: Task) => !isMyTask(t, currentUserId)));
          }

          setReload(false);
          setTasksLoading(false);

        } catch (err) {
          console.error("ดึงข้อมูลไม่สำเร็จ:", err);
          setMyTasks([]);
          setOtherTasks([]);
          setReload(false);
          setTasksLoading(false);
        }
      };

      ReloadData();
    }
    
    if (reloadTaskMembers) {
        // Refresh Task members
      const refreshProjectMembers = async () => {
      setError(null);
      setReloadTaskMembers(true);

      try {
        const [projectRes, userRes] = await Promise.all([
          axios.get(`/api/projects/${projectId}`),
          axios.get(`/api/auth/me`).catch(() => null),
        ]);

        const project = projectRes.data?.project;
        const currentUser = userRes?.data?.user ?? null;

        if (!project) {
          setError("ไม่พบข้อมูลโปรเจ็กต์");
          return;
        }

        if (currentUser) setUser(currentUser);

        let membersWithUserInfo: any[] = [];

        try {
          const membersRes = await axios.get(
            `/api/project-members?projectDocumentId=${projectId}&projectIdNumber=${project.id}`
          );

          if (membersRes.data?.success) {
            const members = membersRes.data.projectMembers ?? [];

            // user info parallel
            membersWithUserInfo = await Promise.all(
              members.map(async (member: any) => {
                try {
                  const userRes = await axios.get(
                    `/api/users?userId=${member.user_id_in_project}`
                  );

                  return {
                    ...member,
                    userInfo: userRes.data?.user ?? null,
                  };
                } catch {
                  return {
                    ...member,
                    userInfo: null,
                  };
                }
              })
            );
          }
        } catch (err) {
          console.error("Fetch members failed:", err);
        } finally {
          setProjectMembers(membersWithUserInfo);
          setMembersLoading(false);
        }

        if (currentUser) {
          const isLeader =
            project.created_by_user_id === currentUser.id ||
            project.created_by_user === currentUser.id;

          if (isLeader) {
            setUserRole("Leader");
          } else {
            const member = membersWithUserInfo.find(
              (m) =>
                (m.userInfo?.id ?? m.user_id_in_project) === currentUser.id
            );

            setUserRole(member?.role_in_project ?? "Member");
          }
        }

        try {
          const tasksRes = await axios.get(
            `/api/tasks?projectDocumentId=${projectId}`
          );

          const tasks = tasksRes.data?.tasks ?? [];
          const currentUserId = currentUser?.id;
          const isMyTask = (task: Task, currentUserId: number) => {
            return Array.isArray(task.assigned_to_user_ids)
              && task.assigned_to_user_ids.some(
                (user: any) => user?.id === currentUserId
              );
          };

          if (!currentUserId) {
            setMyTasks([]);
            setOtherTasks(tasks);
          } else {
            setMyTasks(
              tasks.filter((t: Task) => isMyTask(t, currentUserId))
            );

            setOtherTasks(
              tasks.filter((t: Task) => !isMyTask(t, currentUserId))
            );
          }
          setTasksLoading(false);
        } catch (err) {
          console.error("Fetch tasks failed:", err);
          setMyTasks([]);
          setOtherTasks([]);
          setTasksLoading(false);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setReloadTaskMembers(false);
      }
    };
      refreshProjectMembers();
    }
  },[reload, reloadTaskMembers]);

  //for drag board (Update ui task position)
  const updateTaskPosition = (
    documentId: string,
    boardName: string,
    x: number,
    y: number,
    isLeft: boolean
  ) => {
    const update = (tasks: Task[]) =>
      tasks.map((t) =>
        t.documentId === documentId
          ? { ...t, board_name: boardName, pos_x: x, pos_y: y, is_left: isLeft }
          : t
      );

    setMyTasks((prev) => update(prev));
    setOtherTasks((prev) => update(prev));
  };

  //for drag board (Update ui Board)
  const updateBoards = (newBoards: string[]) => {
    setProject((prev: any) => ({
      ...prev,
      boards: newBoards
    }));
  };

  //for drag board (Update ui current Board)
  const updateCurrentBoards = (newBoards: string[]) => {
    setProject((prev: any) => ({
      ...prev,
      currentBoard: newBoards
    }));
  };

  // Create task function
  const handleCreateTask = async (taskData: any) => {
    try {
      setCreateTaskLoading(true);
      
      // รวมวันที่และเวลา
      let combineBeginDate
      let combinedDueDate

      if (taskData.dueTime) {
        combinedDueDate = new Date(
          `${taskData.dueDate}T${taskData.dueTime}:00`
        ).toISOString();
      }

      if (taskData.beginTime) {
        combineBeginDate = new Date(
          `${taskData.beginDate}T${taskData.beginTime}:00`
        ).toISOString();
      }
      
      const response = await axios.post('/api/tasks/create', {
        task_name: taskData.taskName,
        description: taskData.description,
        due_date: combinedDueDate,
        begin_date: combineBeginDate,
        project_document_id: projectId,
        project_id_number: project?.id,
        assigned_to_user_ids_number: taskData.assignedUserId,
        task_status: 'not turn in',
        task_color: taskData.color,
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
        
        // setShowCreateTaskModal(false);
        // alert('Task created successfully!');
      } else {
        // alert('Error creating task: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      // alert('Error creating task: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreateTaskLoading(false);
    }
  };

  // Create task Location
  const handleCreateLocation = async (taskData: any) => {
    try {
      setCreateTaskLoading(true);
      
      let combineBeginDate
      let combinedDueDate

      if (taskData.dueTime) {
        combinedDueDate = new Date(
          `${taskData.dueDate}T${taskData.dueTime}:00`
        ).toISOString();
      }

      if (taskData.beginTime) {
        combineBeginDate = new Date(
          `${taskData.beginDate}T${taskData.beginTime}:00`
        ).toISOString();
      }
      
      const response = await axios.post('/api/tasks/createLocation', {
        task_name: taskData.taskName,
        description: taskData.description,
        due_date: combinedDueDate,
        begin_date: combineBeginDate,
        project_document_id: projectId,
        project_id_number: project?.id,
        assigned_to_user_ids_number: taskData.assignedUserId,
        task_status: 'not turn in',
        latitude: taskData.latitude,
        longitude: taskData.longitude,
        address: taskData.address,
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
      } else {
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
    } finally {  
      setCreateTaskLoading(false);
      setShowCreateLocationModal(false);
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
      
      const payload = {
        project_document_id: projectId,
        project_id_number: project?.id,
        user_id_in_project: memberData.userId,
        role_in_project: memberData.role,
        join_date: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      };
      
      console.log('Adding member with payload:', payload);
      
      const response = await axios.post('/api/project-members', payload);

      console.log('Add member response:', response.data);

      if (response.data.success) {
        await refreshProjectMembers();
        setShowAddMemberModal(false);
        console.log('Member added successfully!');
      } else {
        console.error('Failed to add member:', response.data.message);
        alert('เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      console.error('Error response:', error.response?.data);
      alert('เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Delete task function
  const handleDeleteTask = async (taskName: string) => {
    if (!selectedTask) return;
    
    if (taskName !== selectedTask.task_name) {
      // alert('ชื่องานไม่ตรงกัน กรุณาพิมพ์ชื่องานให้ถูกต้อง');
      return;
    }

    try {
      setTaskManageLoading(true);
      
      const response = await axios.delete(`/api/tasks/${selectedTask.documentId}`);
      
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
          } else {
            setOtherTasks(allTasks);
            setMyTasks([]);
          }
        }
        
        setShowTaskManageModal(false);
        setSelectedTask(null);
        // alert('ลบงานเรียบร้อยแล้ว!');
      } else {
        // alert('เกิดข้อผิดพลาดในการลบงาน: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting task:', error);
      // alert('เกิดข้อผิดพลาดในการลบงาน: ' + (error.response?.data?.message || error.message));
    } finally {
      setTaskManageLoading(false);
    }
  };

  // Reassign task function
  const handleReassignTask = async (newAssigneeId: number) => {
    if (!selectedTask) return;

    try {
      setTaskManageLoading(true);
      
      console.log('Reassigning task:', selectedTask.documentId, 'to user:', newAssigneeId);
      
      const response = await axios.put(`/api/tasks/${selectedTask.documentId}`, {
        assigned_to_user_ids_number: newAssigneeId
      });
      
      console.log('Reassign response:', response.data);
      
      if (response.data.success) {
        // Refresh tasks data with populated relations
        const tasksResponse = await axios.get(`/api/tasks?projectDocumentId=${projectId}`);
        if (tasksResponse.data.success && tasksResponse.data.tasks) {
          const allTasks = tasksResponse.data.tasks;
          const currentUserId = user?.id;
          
          console.log('Refreshed tasks after reassignment:', allTasks.length);
          
          if (currentUserId) {
            const userTasks = allTasks.filter((task: Task) => 
              task.assigned_to_user_ids_number === currentUserId
            );
            const otherUserTasks = allTasks.filter((task: Task) => 
              task.assigned_to_user_ids_number !== currentUserId
            );
            
            console.log(`Tasks after reassignment - My tasks: ${userTasks.length}, Other tasks: ${otherUserTasks.length}`);
            
            setMyTasks(userTasks);
            setOtherTasks(otherUserTasks);
          } else {
            setOtherTasks(allTasks);
            setMyTasks([]);
          }
        }
        
        setShowTaskManageModal(false);
        setSelectedTask(null);
        // alert('เปลี่ยนผู้รับผิดชอบงานเรียบร้อยแล้ว! ทั้ง number field และ relation field ได้รับการอัปเดตแล้ว');
      } else {
        // alert('เกิดข้อผิดพลาดในการเปลี่ยนผู้รับผิดชอบ: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error reassigning task:', error);
      console.error('Error details:', error.response?.data);
      // alert('เกิดข้อผิดพลาดในการเปลี่ยนผู้รับผิดชอบ: ' + (error.response?.data?.message || error.message));
    } finally {
      setTaskManageLoading(false);
    }
  };

  // Update project function
  const handleUpdateProject = async (projectData: any) => {
    if (!project) return;

    try {
      setProjectManageLoading(true);
      
      console.log('Updating project:', project.documentId || projectId, 'with data:', projectData);
      
      const response = await axios.put(`/api/projects/${project.documentId || projectId}`, {
        project_name: projectData.projectName,
        description: projectData.description,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        project_status: projectData.projectStatus
      });
      
      console.log('Update project response:', response.data);
      
      if (response.data.success) {
        // Update local state
        setProject(response.data.project);
        setShowProjectManageModal(false);
        console.log('Project updated successfully!');
      } else {
        console.error('Failed to update project:', response.data.message);
        alert('เกิดข้อผิดพลาดในการแก้ไขโปรเจค: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      console.error('Error details:', error.response?.data);
      alert('เกิดข้อผิดพลาดในการแก้ไขโปรเจค: ' + (error.response?.data?.message || error.message));
    } finally {
      setProjectManageLoading(false);
    }
  };

  // Delete project function
  const handleDeleteProject = async (projectName: string) => {
    if (!project) return;
    
    if (projectName !== project.project_name) {
      alert('ชื่อโปรเจคไม่ตรงกัน กรุณาพิมพ์ชื่อโปรเจคให้ถูกต้อง');
      return;
    }

    try {
      setProjectManageLoading(true);
      
      const response = await axios.delete(`/api/projects/${project.documentId || projectId}`);
      
      if (response.data.success) {
        console.log('Project deleted successfully');
        setShowProjectManageModal(false);
        alert('ลบโปรเจคเรียบร้อยแล้ว!');
        // Navigate back to overview
        router.push('/main_pages/overview');
      } else {
        alert('เกิดข้อผิดพลาดในการลบโปรเจค: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('เกิดข้อผิดพลาดในการลบโปรเจค: ' + (error.response?.data?.message || error.message));
    } finally {
      setProjectManageLoading(false);
    }
  };

  // Remove member function
  const handleRemoveMember = async (member: ProjectMember, memberName: string) => {
    // console.log('=== REMOVE MEMBER DEBUG ===');
    // console.log('handleRemoveMember called with member:', JSON.stringify(member, null, 2));
    // console.log('Member name:', memberName);
    // console.log('Project ID:', projectId);
    
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะนำ ${memberName} ออกจากโปรเจ็กต์นี้?`)) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      // Use the member's internal ID for loading state tracking
      const loadingId = member.id || member.user_id_in_project;
      console.log('Setting removeMemberLoading to:', loadingId);
      setRemoveMemberLoading(loadingId);
      
      // Use the member's own ID for deletion (simplest approach)
      let deleteParams = '';
      
      // Approach 1: Use member's documentId if available (Strapi v4)
      if (member.documentId) {
        deleteParams = `memberId=${member.documentId}`;
        console.log('Using member documentId:', member.documentId);
      }
      // Approach 2: Use member's internal ID
      else if (member.id) {
        deleteParams = `memberId=${member.id}`;
        console.log('Using member ID:', member.id);
      }
      // Fallback: Try with project and user info
      else {
        deleteParams = `projectDocumentId=${projectId}&userDocumentId=${member.user_id_in_project}`;
        console.log('Using fallback approach with user_id_in_project:', member.user_id_in_project);
      }
      
      console.log('Making DELETE request with params:', deleteParams);
      const response = await axios.delete(`/api/project-members?${deleteParams}`);
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        console.log('Member deleted successfully, refreshing members...');
        await refreshProjectMembers();
        // alert('ลบสมาชิกเรียบร้อยแล้ว!');
      } else {
        console.log('Delete failed:', response.data);
        // alert('เกิดข้อผิดพลาดในการลบสมาชิก: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      console.error('Error response:', error.response?.data);
      // alert('เกิดข้อผิดพลาดในการลบสมาชิก: ' + (error.response?.data?.message || error.message));
    } finally {
      console.log('Setting removeMemberLoading to null');
      setRemoveMemberLoading(null);
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

  const getTimeLeft = (dueDate: string, beginDate: string) => {
    const now = dayjs();
    const due = dayjs(dueDate);
    const begin = dayjs(beginDate);

    const daysBegin = dayjs.duration(begin.diff(now)).asDays();

    if(now.isBefore(begin)) {
      return <div>เริ่มในอีก {Math.floor(daysBegin)} วัน</div>
    }

    if(begin.isBefore(now)){
      if (due.isBefore(now)) {
        return <div className="text-red-500">เลยกำหนด</div>;
      }

      const diff = dayjs.duration(due.diff(now));
      const days = diff.asDays();

      if (days >= 1) {
        return <div>เหลือ {Math.floor(days)} วัน</div>;
      }
      
      const hours = diff.asHours();
      if (hours >= 1) {
        return <div>เหลือ {Math.floor(hours)} ชั่วโมง</div>;
      }
      
      const minutes = diff.asMinutes();
      return <div>เหลือ {Math.floor(minutes)} นาที</div>;
    }
  };

  //Success task
  const totalTasks = allTasks.length;

  const completedTasks = allTasks.filter(
    (task) => task.task_status === "completed"
  ).length;

const progressPercent =
  totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  //filter task data
  const filterLabelMap = {
    "All": "ทั้งหมด",
    "myTask": "งานของฉัน",
    "not turn in": "ยังไม่ส่ง",
    "continue": "กำลังดำเนินการ",
    "pending_review": "รอตรวจสอบ",
    "rejected": "ไม่ผ่าน",
    "completed": "เสร็จแล้ว",
    "late": "เลยกำหนด",
  };

  type TaskFilter = keyof typeof filterLabelMap;

  const today = new Date();

  const filteredTasks = (
      taskFilter === "myTask"
          ? myTasks
          : taskFilter === "All"
          ? [...myTasks, ...otherTasks]
          : [...myTasks, ...otherTasks]
      )
        .filter((task) => {
          if (taskFilter === "All" || taskFilter === "myTask") return true;
          if (taskFilter === "late") {
            if (!task.due_date) return false;
            return (
              new Date(task.due_date) < today &&
              task.task_status !== "completed"
            );
          }
          return task.task_status === taskFilter;
        })
        .sort((a, b) => {
          const statusPriority = (status: string) => {
            if (status === "completed") return 3;
            if (status === "pending_review") return 2;
            return 1;
          };

          const priorityDiff =
            statusPriority(a.task_status) -
            statusPriority(b.task_status);

          if (priorityDiff !== 0) return priorityDiff;

          if (!a.due_date) return 1;
          if (!b.due_date) return -1;

          return (
            new Date(a.due_date).getTime() -
            new Date(b.due_date).getTime()
          );
        });

  // Import color utility
  const { getTaskStatusConfig: getUtilityTaskStatusConfig } = require('../../../utils/taskStatusColors');
  
  // Get status config for tasks - ใช้ utility function
  const getTaskStatusConfig = (status: string) => {
    const config = getUtilityTaskStatusConfig(status);
    return {
      bgColor: config.lightBgColor,
      borderColor: config.borderColor,
      textColor: config.textColor,
      statusText: config.text,
      statusBg: `${config.lightBgColor} ${config.textColor}`
    };
  };

  // Render Task Card
  const renderTaskCard = (task: Task) => {
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

    return (
      <RenderTaskCard 
        key={task.id}
        task={task}
        setSelectedTask={setSelectedTask}
        setPopupTask={setPopupTask}
        userRole={userRole}
        setShowTaskManageModal={setShowTaskManageModal}
        getTaskStatusConfig={getTaskStatusConfig}
        getTimeLeft={getTimeLeft}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูลโปรเจ็กต์...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6 dark:text-gray-300">กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ลองใหม่
            </button>
            <a 
              href="/main_pages/overview" 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block dark:bg-gray-300 dark:hover:bg-gray-400 dark:text-gray-800"
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">ไม่พบโปรเจ็กต์</h2>
          <p className="text-gray-600 mb-6 dark:text-gray-300">โปรเจ็กต์ที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
          <a 
            href="/main_pages/overview" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors dark:bg-gray-300 dark:hover:bg-gray-400 dark:text-gray-800"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  const statusConfig = getTaskStatusConfig(project.project_status || 'pending');

  // TaskManage Modal Component
  const TaskManageModal = () => {
    const [action, setAction] = useState<'delete' | 'reassign'>('delete');
    const [taskNameInput, setTaskNameInput] = useState('');
    const [newAssigneeId, setNewAssigneeId] = useState<number | null>(null);

    const resetModal = () => {
      setAction('delete');
      setTaskNameInput('');
      setNewAssigneeId(null);
      setShowTaskManageModal(false);
      setSelectedTask(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (action === 'delete') {
        handleDeleteTask(taskNameInput);
      } else if (action === 'reassign' && newAssigneeId) {
        handleReassignTask(newAssigneeId);
      }
    };

    if (!showTaskManageModal || !selectedTask) return null;

    // Get current assignee info
    const currentAssignee = projectMembers.find(member => 
      (member.userInfo?.id || member.user_id_in_project) === selectedTask.assigned_to_user_ids_number
    );

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">จัดการงาน</h3>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">{selectedTask.task_name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetModal}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-600"
              disabled={taskManageLoading}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
                เลือกการจัดการ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                  action === 'delete'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'border-gray-200 bg-white dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={(e) => setAction(e.target.value as 'delete' | 'reassign')}
                    className="sr-only"
                    disabled={taskManageLoading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">ลบงาน</div>
                    <div className="text-xs text-gray-500 mt-1">ลบงานนี้ออกจากโปรเจ็กต์</div>
                  </div>
                  {action === 'delete' && (
                    <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center ml-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>

                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                  action === 'reassign'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'border-gray-200 bg-white dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="action"
                    value="reassign"
                    checked={action === 'reassign'}
                    onChange={(e) => setAction(e.target.value as 'delete' | 'reassign')}
                    className="sr-only"
                    disabled={taskManageLoading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm ">เปลี่ยนผู้รับผิดชอบ</div>
                    <div className="text-xs text-gray-500 mt-1">มอบหมายงานให้คนใหม่</div>
                  </div>
                  {action === 'reassign' && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Delete Action */}
            {action === 'delete' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                  พิมพ์ชื่องานเพื่อยืนยันการลบ <span className="text-red-500">*</span>
                </label>
                <div className="bg-gray-50 rounded-lg p-3 mb-3 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 mb-1 dark:text-gray-200">ชื่องานที่ต้องพิมพ์:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-400">{selectedTask.task_name}</p>
                </div>
                <input
                  type="text"
                  value={taskNameInput}
                  onChange={(e) => setTaskNameInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600"
                  placeholder="พิมพ์ชื่องานตรงตามด้านบน"
                  required
                  disabled={taskManageLoading}
                />
              </div>
            )}

            {/* Reassign Action */}
            {action === 'reassign' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                  เลือกผู้รับผิดชอบใหม่ <span className="text-red-500">*</span>
                </label>
                
                {/* Current Assignee */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 mb-1 dark:text-gray-200">ผู้รับผิดชอบปัจจุบัน:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-300">
                    {currentAssignee?.userInfo?.username || `User ${selectedTask.assigned_to_user_ids_number}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    User ID: {selectedTask.assigned_to_user_ids_number}
                  </p>
                </div>

                <select
                  value={newAssigneeId || ''}
                  onChange={(e) => setNewAssigneeId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                  required
                  disabled={taskManageLoading}
                >
                  <option value="">เลือกผู้รับผิดชอบใหม่</option>
                  {projectMembers
                    .filter(member => (member.userInfo?.id || member.user_id_in_project) !== selectedTask.assigned_to_user_ids_number)
                    .map((member) => (
                      <option 
                        key={member.id} 
                        value={member.userInfo?.id || member.user_id_in_project}
                      >
                        {member.userInfo?.username || `User ${member.user_id_in_project}`} ({member.role_in_project})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-600">
              <button
                type="button"
                onClick={resetModal}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                disabled={taskManageLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  action === 'delete'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
                disabled={taskManageLoading || (action === 'delete' && taskNameInput !== selectedTask.task_name) || (action === 'reassign' && !newAssigneeId)}
              >
                {taskManageLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{action === 'delete' ? 'กำลังลบ...' : 'กำลังเปลี่ยน...'}</span>
                  </>
                ) : (
                  <>
                    {action === 'delete' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>ลบงาน</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>เปลี่ยนผู้รับผิดชอบ</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ProjectManage Modal Component
  const ProjectManageModal = () => {
    const [action, setAction] = useState<'edit' | 'delete'>('edit');
    const [projectNameInput, setProjectNameInput] = useState('');
    const [formData, setFormData] = useState({
      projectName: project?.project_name || '',
      description: project?.description || '',
      startDate: project?.start_date?.split('T')[0] || '',
      endDate: project?.end_date?.split('T')[0] || '',
      projectStatus: project?.project_status || 'active'
    });

    const resetModal = () => {
      setAction('edit');
      setProjectNameInput('');
      setFormData({
        projectName: project?.project_name || '',
        description: project?.description || '',
        startDate: project?.start_date?.split('T')[0] || '',
        endDate: project?.end_date?.split('T')[0] || '',
        projectStatus: project?.project_status || 'active'
      });
      setShowProjectManageModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (action === 'edit') {
        // Validate form data
        if (!formData.projectName.trim() || !formData.description.trim()) {
          alert('กรุณากรอกข้อมูลให้ครบถ้วน');
          return;
        }
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
          alert('วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น');
          return;
        }
        handleUpdateProject(formData);
      } else if (action === 'delete') {
        handleDeleteProject(projectNameInput);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    if (!showProjectManageModal || !project) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto scale-90 md:scale-100 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">จัดการโปรเจค</h3>
                <p className="text-sm text-gray-500 truncate dark:text-gray-300">{project.project_name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetModal}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-600"
              disabled={projectManageLoading}
            >
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
                เลือกการจัดการ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                  action === 'edit'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 '
                    : 'border-gray-200 bg-white dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="action"
                    value="edit"
                    checked={action === 'edit'}
                    onChange={(e) => setAction(e.target.value as 'edit' | 'delete')}
                    className="sr-only"
                    disabled={projectManageLoading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">แก้ไขโปรเจค</div>
                    <div className="text-xs text-gray-500 mt-1">แก้ไขข้อมูลโปรเจค</div>
                  </div>
                  {action === 'edit' && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>

                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                  action === 'delete'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'border-gray-200 bg-white dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={(e) => setAction(e.target.value as 'edit' | 'delete')}
                    className="sr-only"
                    disabled={projectManageLoading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">ลบโปรเจค</div>
                    <div className="text-xs text-gray-500 mt-1">ลบโปรเจคทั้งหมด</div>
                  </div>
                  {action === 'delete' && (
                    <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center ml-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Edit Action */}
            {action === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                    ชื่อโปรเจค <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                    placeholder="กรอกชื่อโปรเจค"
                    required
                    disabled={projectManageLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                    คำอธิบาย <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                    placeholder="อธิบายรายละเอียดโปรเจค"
                    required
                    disabled={projectManageLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                      วันที่เริ่มต้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                      required
                      disabled={projectManageLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                      วันที่สิ้นสุด <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                      required
                      disabled={projectManageLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                    สถานะโปรเจค
                  </label>
                  <select
                    name="projectStatus"
                    value={formData.projectStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                    disabled={projectManageLoading}
                  >
                    <option value="active">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="on-hold">พักการทำงาน</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
              </div>
            )}

            {/* Delete Action */}
            {action === 'delete' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                  พิมพ์ชื่อโปรเจคเพื่อยืนยันการลบ <span className="text-red-500">*</span>
                </label>
                <div className="bg-gray-50 rounded-lg p-3 mb-3 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 mb-1 dark:text-gray-300">ชื่อโปรเจคที่ต้องพิมพ์:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-300">{project.project_name}</p>
                </div>
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                  placeholder="พิมพ์ชื่อโปรเจคตรงตามด้านบน"
                  required
                  disabled={projectManageLoading}
                />
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>คำเตือน:</strong> การลบโปรเจคจะลบข้อมูลทั้งหมด รวมถึงงาน สมาชิก และไฟล์ที่เกี่ยวข้อง และไม่สามารถกู้คืนได้
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={resetModal}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                disabled={projectManageLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  action === 'edit'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                }`}
                disabled={projectManageLoading || (action === 'delete' && projectNameInput !== project.project_name)}
              >
                {projectManageLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{action === 'edit' ? 'กำลังแก้ไข...' : 'กำลังลบ...'}</span>
                  </>
                ) : (
                  <>
                    {action === 'edit' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>บันทึกการแก้ไข</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>ลบโปรเจค</span>
                      </>
                    )}
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
        // alert('กรุณาเลือกผู้ใช้');
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">เพิ่มสมาชิกโปรเจ็กต์</h3>
                <p className="text-sm text-gray- dark:text-gray-300">เชิญสมาชิกใหม่เข้าร่วมโปรเจ็กต์</p>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                เลือกผู้ใช้ <span className="text-red-500">*</span>
              </label>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium">กำลังโหลดรายชื่อผู้ใช้...</p>
                    <p className="text-xs text-gray-400">กรุณารอสักครู่</p>
                  </div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 dark:bg-gray-700 dark:border-gray-400">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 dark:bg-gray-600">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-2 dark:text-gray-300">ไม่มีผู้ใช้ที่สามารถเพิ่มได้</h3>
                    <p className="text-sm text-gray-500 max-w-sm dark:text-gray-400">
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
                      className="w-full px-4 py-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-gray-50 focus:bg-white appearance-none text-sm dark:bg-gray-700 dark:border-gray-400 dark:text-gray-300"
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
              <label className="block text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
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
                        : 'border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-400'
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
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
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
    <div className="min-h-screen w-full bg-white dark:bg-gray-900">
      <div className="flex flex-row justify-center items-start">
        {/* Main Content */}
        <div className={`flex-1 p-6 space-y-1 md:space-y-3 ${ToggleView === 3 ? 'max-w-md md:max-w-[1900px]' : 'max-w-md md:max-w-[1900px]'}`}>
          <div className='flex flex-row justify-between px-4 md:items-center text-sm md:text-base'>
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <a href="/main_pages/overview" className="hover:text-blue-600">Home</a>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium dark:text-gray-200">{project.project_name}</span>
            </div>

            {/*Other option*/}
            <div className='flex'>
              <div className="flex items-center divide-x-2 divide-gray-300 dark:divide-gray-400">               
                {/* Voice button */}
                <div className='flex justify-center items-center px-1 md:px-2'>
                  <VoiceRoomButton slug={project.slug} className='dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 bg-white hover:bg-[#636CCB] text-black hover:text-white px-3 py-1.5 rounded-sm text-sm transition-colors'>
                    ห้องพูดคุย
                  </VoiceRoomButton>
                </div>
                {/* Chat button */}
                <div className='flex justify-center items-center px-1 md:px-2'>
                  <button
                    onClick={() => setOpen(true)}
                      className="relative flex items-center md:space-x-2 bg-white hover:bg-[#636CCB] text-black hover:text-white px-3 py-1.5 rounded-sm text-sm transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.474L3 21l2.474-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                    <span className='hidden md:flex'>เเชท</span>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>
                </div>

                {/* Member button */}
                <div className="flex justify-center items-center px-1 md:px-2">
                  <button
                    className="relative flex items-center md:space-x-2 bg-white hover:bg-[#636CCB] text-black hover:text-white px-3 py-1.5 rounded-sm text-sm transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    onClick={() => setToggleMember(!toggleMember)}
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className='hidden md:flex'>สมาชิก</span>
                  </button>
                </div>

                {/* Project Management Button - Only for Leaders */}
                {userRole === 'Leader' && (
                  <div className="flex justify-center items-center px-1 md:px-2">
                    <button
                      onClick={() => setShowProjectManageModal(true)}
                      className="flex items-center md:space-x-2 px-3 py-1.5 bg-[#636CCB] hover:bg-[#636CCB]/80 text-white rounded-sm text-sm font-medium transition-colors shadow-sm"
                      title="จัดการโปรเจค"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      <span className='hidden md:flex'>จัดการ</span>
                    </button>
                  </div>
                )}        
              </div>
            </div>
          </div>

          {/* Project Header - Compact Design */}
          <div className="bg-white border-b-1 border-gray-300 p-4 mb-6 mt-2 dark:bg-gray-900 dark:border-gray-300">
            <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2 md:gap-0">
              {/* Project Info */}
              { !projectLoading ? (
                <div className="flex items-center space-x-4">
                  <div className="size-7 md:size-9 bg-[#6E8CFB] rounded-sm flex items-center justify-center shadow-sm">
                    <AiFillReconciliation  className='size-5 md:size-6 text-white'/>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 md:space-x-2">
                      <div className="text-2xl mb-1 font-medium text-gray-900 dark:text-gray-300">{project.project_name}</div>
                      <span className={`flex px-2 py-1 rounded-full text-xs font-medium ${
                        userRole === 'Leader' 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {userRole}
                      </span>
                      <span className={`hidden md:flex px-2 py-1 rounded-full text-xs font-medium ${statusConfig.statusBg}`}>
                        {project.project_status}
                      </span>
                    </div>
                  </div>
                  {/* Date begin - end */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <svg className="hidden md:inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className='hidden md:flex'>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                    </div>
                  </div>
                </div>
              ): (
              <div className="flex items-center space-x-4 animate-pulse">
                <div className="h-7 w-full bg-gray-200 rounded mb-2 dark:bg-gray-700" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-4 dark:bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700" />
                  </div>
              </div>)}
              

              <div className='flex flex-row justify-center space-x-2 text-sm md:text-md'>
                {/* Announcement button */}        
                <div className={`flex justify-center items-center ${ToggleView === 0 ? 'text-black border-b-2 dark:border-gray-300 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  <button onClick={() => setToggleView(0)} className={`bg-white py-1 px-2 font-medium rounded-sm hover:bg-gray-100 ring-gray-500 dark:bg-gray-900 dark:hover:bg-gray-600`}>
                    Announcement
                  </button>
                </div>
                {/* overview button */}        
                <div className={`flex justify-center items-center ${ToggleView === 1 ? 'text-black border-b-2 dark:border-gray-300 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  <button onClick={() => setToggleView(1)} className={`bg-white py-1 px-2 font-medium rounded-sm hover:bg-gray-100 ring-gray-500 dark:bg-gray-900 dark:hover:bg-gray-600`}>
                    Overview
                  </button>
                </div>

                {/* Board button */}        
                <div className={`flex justify-center items-center ${ToggleView === 2 ? 'text-black border-b-2 dark:border-gray-300 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  <button onClick={() => setToggleView(2)} className={`bg-white py-1 px-2 font-medium rounded-sm hover:bg-gray-100 ring-gray-500 dark:bg-gray-900 dark:hover:bg-gray-600`}>
                    Board
                  </button>
                </div>

                {/* GanttChart button */}        
                <div className={`flex justify-center items-center ${ToggleView === 3 ? 'text-black border-b-2 dark:border-gray-300 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  <button onClick={() => setToggleView(3)} className={`bg-white py-1 px-2 font-medium rounded-sm hover:bg-gray-100 ring-gray-500 dark:bg-gray-900 dark:hover:bg-gray-600`}>
                    Timeline
                  </button>
                </div>
              </div>
            </div>
          </div>

        {ToggleView === 0 && !tasksLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tasks */}
            <div className="lg:col-span-3">

              {/* Tasks Overview */}
              <div className="space-y-4">
                {/* My Tasks */}
                <div className="bg-white border-b-2 border-gray-200 px-3 dark:bg-gray-900 dark:border-gray-300">
                  <div className="flex items-center justify-between mb-6 md:space-x-20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GrAnnounce className='size-4 dark:text-black'/>
                      </div>
                      <div className='flex flex-row items-center space-x-2'>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">ประกาศ</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">( {[...myTasks, ...otherTasks].filter(task => task.task_type === 'location_task').length})</p>
                      </div>

                    </div>

                    {userRole === 'Leader' && (
                      <div className='relative'>
                        <button 
                          onClick={() => {setOpenOptions(prev => !prev) }}
                          className="flex items-center space-x-1 md:space-x-2 bg-[#6E8CFB] hover:bg-[#6E8CFB]/80 text-white py-2 md:py-1 px-2 md:px-3 md:py-2 rounded-lg font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className='text-sm'>เพิ่มงาน</span>
                        </button>

                        {/* Options */}
                      <div
                        className={`
                          absolute right-0 mt-2 w-40 bg-white shadow-md border border-gray-200 z-30 dark:bg-gray-700 dark:border-gray-600 
                          transform transition-all duration-500 divide-y divide-gray-200
                          ${openOptions
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-3 pointer-events-none"}
                        `}
                      >
                        <div className={`
                          transform transition-all duration-200 truncate
                          ${openOptions
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-4"}
                        `}>
                          <button
                            onClick={() => {
                              setShowCreateTaskModal(true);
                              setOpenOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 hover:text-[#50589C]"
                          >
                            <div className='flex flex-row items-center gap-2'>
                              <AiFillFileText className='size-4'/>
                              <span className='text-md flex-1'>งานทั่วไป</span>
                            </div>
                             
                          </button>
                        </div>

                        <div className={`
                          transform transition-all duration-200 delay-200
                          ${openOptions
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-4"}
                        `}>
                          <button
                            onClick={() => {
                              setShowCreateLocationModal(true);
                              setOpenOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 hover:text-[#50589C]"
                          >
                            <div className='flex flex-row items-center gap-2'>
                              <AiFillEnvironment className='size-4'/>
                              <span className='text-md flex-1'>นัดหมาย</span>
                            </div>
                          </button>
                        </div>
                                          
                        </div>    
                      </div>               
                    )}                    
                  </div>
                  
                  <div className="grid grid-cols-1 max-h-[calc(90vh-240px)] px-2 py-2 mb-6 overflow-y-auto gap-2 ">
                    {filteredTasks.filter(task => task.task_type === 'location_task').length > 0 ? (
                      filteredTasks
                        .filter((task) => {
                            if(task.task_type === 'normal_task') {
                              return false
                            }

                            return true;
                        })
                        .map(task => renderTaskCard(task))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">ยังไม่มีประกาศในโปรเจคนี้</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>)}

          {ToggleView === 1 && !tasksLoading && (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tasks */}
            <div className="lg:col-span-3">

              {/* Tasks Overview */}
              <div className="space-y-4">
                {/* My Tasks */}
                <div className="bg-white border-b-2 border-gray-200 px-3 dark:bg-gray-900 dark:border-gray-300">
                  <div className="flex items-center justify-between mb-6 space-x-20">
                    <div className="flex items-center space-x-3">

                      <div className="flex flex-col items-start md:items-center space-x-3 md:flex-row ">
                        <div className='flex flex-row items-center space-x-2'>
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className='flex flex-row items-center space-x-2'>
                            <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate dark:text-gray-300">
                              <span className="md:hidden">งาน</span>
                              <span className="hidden md:inline">งานของโปรเจค</span>
                            </h3>
                            <p className="text-sm text-gray-500 truncate">( {[...myTasks, ...otherTasks].length} งาน )</p>
                          </div>
                        </div>
                        
                        <div className="relative inline-block md:mt-0 mt-4 text-sm md:text-base">
                          {/* Trigger */}
                          <button
                            onClick={() => setOpenFilter((prev) => !prev)}
                            className="flex items-center gap-2 py-2 px-3 md:py-1 md:px-4 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-700 whitespace-nowrap"
                          >
                            <span>{filterLabelMap[taskFilter]}</span>

                            {/* Arrow Icon */}
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${
                                openFilter ? "rotate-180" : "rotate-0"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown */}
                          <div
                            className={`
                              absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-20
                              border border-gray-100 dark:bg-gray-700 dark:border-gray-600
                              transform transition-all duration-300 ease-out origin-top
                              ${
                                openFilter
                                  ? "opacity-100 scale-100 translate-y-0"
                                  : "opacity-0 scale-95 -translate-y-3 pointer-events-none"
                              }
                            `}
                          >
                            {/* Section: ภาพรวม */}
                            <div className="px-3 py-2">
                              <p className="text-xs font-semibold text-gray-400 mb-1 dark:text-gray-300">ภาพรวม</p>
                              {["All", "myTask"].map((key) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setTaskFilter(key as TaskFilter);
                                    setOpenFilter(false);
                                  }}
                                  className={`
                                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    transition-all duration-200
                                    ${
                                      taskFilter === key
                                        ? "bg-[#50589C]/10 text-[#50589C] font-medium dark:text-white dark:bg-[#50589C]/20"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                                    }
                                  `}
                                >
                                  <span className="text-base">
                                    {key === "All" ? <FcSurvey className="size-5"/> : <IoMdPerson className="size-5"/>}
                                  </span>
                                  {(filterLabelMap as any)[key]}
                                </button>
                              ))}
                            </div>

                            <div className="h-px bg-gray-100 my-1" />

                            {/* Section: สถานะงาน */}
                            <div className="px-3 py-2">
                              <p className="text-xs font-semibold text-gray-400 mb-1 dark:text-gray-300">สถานะงาน</p>
                              {["not turn in", "continue", "pending_review", "rejected"].map((key) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setTaskFilter(key as TaskFilter);
                                    setOpenFilter(false);
                                  }}
                                  className={`
                                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    transition-all duration-200
                                    ${
                                      taskFilter === key
                                        ? "bg-[#50589C]/10 text-[#50589C] font-medium dark:text-white dark:bg-[#50589C]/20"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                                    }
                                  `}
                                >
                                  <span className="text-base">
                                    {key === "not turn in" && <CgSandClock  className="size-5 text-yellow-600"/>}
                                    {key === "continue" && <FcProcess className="size-5"/>}
                                    {key === "pending_review" && <FcSearch className="size-5"/>}
                                    {key === "rejected" && <FaTimes  className="size-5 text-red-600"/>}
                                  </span>
                                  {(filterLabelMap as any)[key]}
                                </button>
                              ))}
                            </div>

                            <div className="h-px bg-gray-100 my-1" />

                            {/* Section: ผลลัพธ์ */}
                            <div className="px-3 py-2">
                              <p className="text-xs font-semibold text-gray-400 mb-1 dark:text-gray-300">ผลลัพธ์</p>
                              {["completed", "late"].map((key) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setTaskFilter(key as TaskFilter);
                                    setOpenFilter(false);
                                  }}
                                  className={`
                                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    transition-all duration-200
                                    ${
                                      taskFilter === key
                                        ? "bg-[#50589C]/10 text-[#50589C] font-medium dark:text-white dark:bg-[#50589C]/20"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                                    }
                                  `}
                                >
                                  <span className="text-base">
                                    {key === "completed" ? <FcOk className="size-5"/> : <FcHighPriority className="size-5"/>}
                                  </span>
                                  {(filterLabelMap as any)[key]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>

                    <div className="flex flex-col items-end md:items-start space-x-3 md:flex-row md:justify-between w-full">
                      <div className="flex-1 space-y-1 mb-1 ">
                        {/* Label */}
                        <div className="flex justify-between text-xs text-gray-600 w-full md:w-8/10 dark:text-gray-300">
                          <span className="truncate">ความคืบหน้า</span>
                            <span className="truncate">
                              {completedTasks}/{totalTasks} งาน ({progressPercent}%)
                            </span>
                          </div>

                          {/* Progress bar background */}
                          <div className="w-full md:w-8/10 h-3 bg-gray-200 rounded-full overflow-hidden">
                            {/* Progress bar */}
                            <div
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                      </div>


                      {userRole === 'Leader' && (
                        <div className='relative'>
                          <button
                            onClick={() => { setOpenOptions(prev => !prev) }}
                            className="flex items-center space-x-2 mr-3 md:mr-0 mt-2 md:mt-0 bg-[#6E8CFB] hover:bg-[#6E8CFB]/80 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>สร้างงาน</span>
                          </button>

                        {/* Options */}
                        <div
                          className={`
                            absolute right-0 mt-2 w-40 bg-white shadow-md border border-gray-200 z-30 dark:bg-gray-700 dark:border-gray-600
                            transform transition-all duration-500 divide-y divide-gray-200
                            ${openOptions
                              ? "opacity-100 scale-100 translate-y-0"
                              : "opacity-0 scale-95 -translate-y-3 pointer-events-none"}
                          `}
                        >
                          <div className={`
                            transform transition-all duration-200 truncate
                            ${openOptions
                              ? "opacity-100 scale-100 translate-y-0"
                              : "opacity-0 scale-95 -translate-y-4"}
                          `}>
                            <button
                              onClick={() => {
                                setShowCreateTaskModal(true);
                                setOpenOptions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 hover:text-[#50589C]"
                            >
                              <div className='flex flex-row items-center gap-2'>
                                <AiFillFileText className='size-4'/>
                                <span className='text-md flex-1'>งานทั่วไป</span>
                              </div>
                              
                            </button>
                          </div>

                          <div className={`
                            transform transition-all duration-200 delay-200
                            ${openOptions
                              ? "opacity-100 scale-100 translate-y-0"
                              : "opacity-0 scale-95 -translate-y-4"}
                          `}>
                            <button
                              onClick={() => {
                                setShowCreateLocationModal(true);
                                setOpenOptions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 hover:text-[#50589C]"
                            >
                              <div className='flex flex-row items-center gap-2'>
                                <AiFillEnvironment className='size-4'/>
                                <span className='text-md flex-1'>นัดหมาย</span>
                              </div>
                            </button>
                          </div>
                                            
                          </div>    
                        </div>               
                      )} 
                    </div>
             
                  </div>
                  
                  <div className="grid grid-cols-1 max-h-[calc(90vh-240px)] px-2 py-2 mb-6 overflow-y-auto lg:grid-cols-2 gap-2 ">
                    {filteredTasks.length > 0 ? (
                      filteredTasks
                        .filter((task) => {
                            if(task.task_type === 'location_task') {
                              return false
                            }

                            return true;
                        })
                        .map(task => renderTaskCard(task))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">ยังไม่มีงานที่มอบหมายให้คุณ</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>)}

        {ToggleView === 2 && !tasksLoading && (
          <div>
            <FreeDragBoard 
              tasks={[...myTasks, ...otherTasks]} 
              project={project}
              projectId={projectId}
              SelectedTask={(task: Task) => setSelectedTask(task)}
              onOpenPopup={() => setPopupTask(true)}
              updateTaskPosition={updateTaskPosition}
              onReload={setReload}
              isReload={reload}
              isOpen={showCreateTaskModal}
              onClickTask={() => setShowCreateTaskModal(true)}
              onClose={() => setShowCreateTaskModal(false)}
              onSubmit={handleCreateTask}
              projectMembers={projectMembers}
              isLoading={createTaskLoading}
              userRole={userRole}
              updateBoards={updateBoards}
              updateCurrentBoards={updateCurrentBoards}
            />
          </div>
        )}

        {ToggleView === 3 && !tasksLoading && (
          <div className="grid grid-cols-1">
            {/*GanttChart*/}
            <GanttChart tasks={[...myTasks, ...otherTasks]} />
          </div> 
        )} 

        {/* loading task */}
        {tasksLoading && (
          <SkeletonTask />
        )}

        </div>
      </div>

      {/* task popup */}
      {popupTask && (
        <TaskPopup 
          projectId={project.id}
          project={project}
          task={selectedTask} 
          setSelectedTask={setSelectedTask}
          projectMembers={projectMembers}
          currentUser={user}
          userRole={userRole}
          onClose={() => {setSelectedTask(null); setPopupTask(false)}} 
          onSubmit={() => {router.push(`/main_pages/projects/${projectId}/tasks/${selectedTask?.documentId}`);}}
          onRefresh={() => setReloadTaskMembers(true)}
          refreshTaskMembers={reloadTaskMembers}       
        />
      )}
      
      <ProjectChatPopup
        projectSlug={project.slug}
        projectName={project.project_name}
        getToken={token}
        open={open}
        onOpenChange={(o) => {
          if (!o) setUnread(0);
            setOpen(o);
          }}
        currentUserId={user?.id}
        onUnreadChange={setUnread}
      />

      {/* Create Task Modal - Only for Leaders */}
      {userRole === 'Leader' && (
        <CreateTaskModal 
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSubmit={handleCreateTask}
          projectMembers={projectMembers}
          isLoading={createTaskLoading}
        />
      )}

      {userRole === 'Leader' && (
        <GoogleMapsProvider>
          <SelectLocationMap 
            isOpen={showCreateLocationModal}
            onClose={() => setShowCreateLocationModal(false)}
            onSubmit={handleCreateLocation}
            isLoading={createTaskLoading}
          />      
        </GoogleMapsProvider>
         
      )}

      {toggleMember && (
        <MemberPopup
          toggleMember={toggleMember}
          setToggleMember={setToggleMember}
          projectMembers={projectMembers}
          refreshProjectMembers={refreshProjectMembers}
          membersLoading={membersLoading}
          setShowAddMemberModal={setShowAddMemberModal}
          userRole={userRole}
          removeMemberLoading={removeMemberLoading}
          formatDate={formatDate}
          handleRemoveMember={handleRemoveMember}
        />
      )}

      {/* Add Member Modal - Only for Leaders */}
      {userRole === 'Leader' && <AddMemberModal />}

      {/* Task Manage Modal - Only for Leaders */}
      {userRole === 'Leader' && <TaskManageModal />}

      {/* Project Manage Modal - Only for Leaders */}
      {userRole === 'Leader' && <ProjectManageModal />}
    </div>
  );
}