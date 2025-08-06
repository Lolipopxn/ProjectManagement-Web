import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

// Interface สำหรับ project data
interface Project {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any;
  created_by_user: number;
  attributes?: any;
  userRole?: string; // เพิ่มบทบาทของผู้ใช้ในโปรเจ็กต์
  created_by_user_info?: any; // ข้อมูลผู้สร้างโปรเจ็กต์
}

// Interface สำหรับ project member data
interface ProjectMember {
  id: number;
  role_in_project: string;
  join_date: string;
  project_id_number: number;
  user_id_in_project: number;
}

// Interface สำหรับ user data
interface User {
  id: number;
  username: string;
  email: string;
}

// Interface สำหรับ response data
interface OverviewData {
  user: User | null;
  projects: Project[];
  userOwnProjects: Project[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // อ่าน token จาก cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    console.log('Overview API - Token found:', !!token);

    if (!token) {
      return NextResponse.json({ 
        error: 'No authentication token found' 
      }, { status: 401 });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const userResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
      headers
    });

    const currentUser = userResponse.data;
    console.log('Overview API - Current user:', currentUser);

    if (!currentUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // ดึงข้อมูลโปรเจ็กต์ทั้งหมดพร้อม populate created_by_user
    const projectsResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/projects?populate=*`, {
      headers
    });

    // ดึงข้อมูล project members ที่ user นี้เป็นสมาชิก
    const projectMembersResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/project-members?filters[user_id_in_project][$eq]=${currentUser.id}`, {
      headers
    });

    // ดึงข้อมูล users ทั้งหมดเพื่อใช้ในการแสดงชื่อผู้สร้าง
    const usersResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users`, {
      headers
    });

    const allProjects: Project[] = projectsResponse.data.data || [];
    const userProjectMembers: ProjectMember[] = projectMembersResponse.data.data || [];
    const allUsers = usersResponse.data || [];
    
    console.log('Overview API - All projects count:', allProjects.length);
    console.log('Overview API - User project members:', userProjectMembers);
    console.log('Overview API - All users count:', allUsers.length);

    // สร้าง map ของ user_id -> user object
    const userMap = new Map();
    allUsers.forEach((user: any) => {
      userMap.set(user.id, user);
    });

    // สร้าง map ของ project_id -> role สำหรับ user นี้
    const projectRoleMap = new Map<number, string>();
    userProjectMembers.forEach((member: ProjectMember) => {
      projectRoleMap.set(member.project_id_number, member.role_in_project);
    });

    // สร้าง array ของ project_id_number ที่ user เป็นสมาชิก
    const userProjectIds = userProjectMembers.map((member: ProjectMember) => member.project_id_number);
    console.log('Overview API - User project IDs:', userProjectIds);

    // กรองโปรเจ็กต์ที่ user เป็นสมาชิกและเพิ่มข้อมูลบทบาท + ข้อมูลผู้สร้าง
    const userOwnProjects = allProjects
      .filter(project => userProjectIds.includes(project.id))
      .map(project => {
        // ดึงข้อมูลผู้สร้างจาก created_by_user field
        const createdByUser = userMap.get(project.created_by_user);
        
        return {
          ...project,
          userRole: projectRoleMap.get(project.id) || 'member',
          created_by_user_info: createdByUser || null // เพิ่มข้อมูลผู้สร้าง
        };
      });
    
    console.log('Overview API - User own projects count:', userOwnProjects.length);
    console.log('Overview API - User own projects with roles:', userOwnProjects.map(p => ({ 
      id: p.id, 
      name: p.project_name, 
      role: p.userRole 
    })));

    // คำนวณสถิติโปรเจ็กต์
    const stats = {
      totalProjects: userOwnProjects.length,
      activeProjects: userOwnProjects.filter(p => p.project_status === 'active' || p.project_status === 'in-progress').length,
      completedProjects: userOwnProjects.filter(p => p.project_status === 'completed').length,
      pendingProjects: userOwnProjects.filter(p => p.project_status === 'pending' || p.project_status === 'planning').length,
    };

    const responseData: OverviewData = {
      user: currentUser,
      projects: allProjects,
      userOwnProjects,
      stats
    };

    console.log('Overview API - Response stats:', stats);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Overview API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed' 
      }, { status: 401 });
    }

    if (error.response?.status === 403) {
      return NextResponse.json({ 
        error: 'Access forbidden' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch overview data',
      details: error.message 
    }, { status: 500 });
  }
}
