import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ 
        projects: [],
        tasks: [],
        hasAuth: false 
      });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let projects = [];
    let tasks = [];

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    let currentUserId: number | null = null;
    
    try {
      const userResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
        headers
      });
      const currentUser = userResponse.data;
      currentUserId = currentUser?.id;

      if (currentUserId) {
        // ดึงโปรเจ็กต์ที่ user เป็นสมาชิก
        const projectMembersResponse = await axios.get(
          `${process.env.STRAPI_BASE_URL}/api/project-members?filters[user_id_in_project][$eq]=${currentUserId}`, 
          { headers }
        );

        const projectsResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/projects`, {
          headers
        });

        const allProjects = projectsResponse.data.data || [];
        const userProjectMembers = projectMembersResponse.data.data || [];

        // กรองโปรเจ็กต์ที่ user เป็นสมาชิก
        const userProjectIds = userProjectMembers.map((member: any) => member.project_id_number);
        
        // รวมโปรเจ็กต์ที่ user เป็นสมาชิกและที่ user เป็นคนสร้าง
        projects = allProjects.filter((project: any) => {
          // เป็นสมาชิกใน project หรือเป็นคนสร้าง project
          const isMember = userProjectIds.includes(project.id);
          const isCreator = project.created_by_user === currentUserId;
          
          console.log(`Project ${project.project_name} (ID: ${project.id}):`, {
            isMember,
            isCreator,
            created_by_user: project.created_by_user,
            currentUserId,
            included: isMember || isCreator
          });
          
          return isMember || isCreator;
        });

        // ดึงงานที่ถูกมอบหมายให้ user
        const tasksResponse = await axios.get(
          `${process.env.STRAPI_BASE_URL}/api/tasks?filters[assigned_to_user_ids_number][$eq]=${currentUser.id}&populate=*`,
          { headers }
        );

        tasks = tasksResponse.data.data || [];

        console.log('Sidebar API - Current User ID:', currentUserId);
        console.log('Sidebar API - User project member IDs:', userProjectIds);
        console.log('Sidebar API - Total projects in system:', allProjects.length);
        console.log('Sidebar API - Filtered projects for user:', projects.length);
        console.log('Sidebar API - Projects details:', projects.map((p: any) => ({ id: p.id, name: p.project_name, created_by: p.created_by_user })));
      }
    } catch (projectError) {
      console.error('Failed to fetch projects for sidebar:', projectError);
    }

    // ดึงข้อมูล tasks ที่เกี่ยวข้องกับโปรเจ็กต์ที่ user เป็นสมาชิก
    try {
      if (projects.length > 0) {
        // ลองเรียก API โดยไม่ populate ก่อน
        const tasksResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/tasks`, {
          headers
        });
        
        console.log('Tasks response status:', tasksResponse.status);
        console.log('Tasks response data structure:', JSON.stringify(tasksResponse.data, null, 2).substring(0, 500));
        
        const allTasks = tasksResponse.data.data || [];
        
        // กรอง tasks ที่ user ได้รับมอบหมาย
        const userTasks = allTasks.filter((task: any) => {
          // ตรวจสอบว่า task ถูกมอบหมายให้ user หรือไม่
          return task.assigned_to_user_ids_number === currentUserId;
        });

        // ถ้ามี tasks ให้ดึงข้อมูล project สำหรับแต่ละ task
        if (userTasks.length > 0) {
          const tasksWithProjects = await Promise.all(
            userTasks.map(async (task: any) => {
              try {
                // ดึงข้อมูล project ของ task นี้
                const projectResponse = await axios.get(
                  `${process.env.STRAPI_BASE_URL}/api/projects?documentId=${task.project_document_id}`,
                  { headers }
                );
                
                const projectData = projectResponse.data.data?.[0];
                return {
                  ...task,
                  project: projectData ? {
                    id: projectData.id,
                    project_name: projectData.project_name,
                    documentId: projectData.documentId
                  } : null
                };
              } catch (error) {
                console.error(`Error fetching project for task ${task.id}:`, error);
                return task; // คืนค่า task โดยไม่มีข้อมูล project
              }
            })
          );
          
          tasks = tasksWithProjects;
        }

        console.log('Sidebar API - User tasks count:', tasks.length);
      }
    } catch (taskError: any) {
      console.error('Failed to fetch tasks for sidebar:', taskError);
      console.error('Error details:', {
        message: taskError?.message,
        status: taskError?.response?.status,
        data: taskError?.response?.data
      });
    }

    return NextResponse.json({
      projects,
      tasks,
      hasAuth: true
    });

  } catch (error: any) {
    console.error('Sidebar API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sidebar data',
        projects: [],
        tasks: [],
        hasAuth: false
      }, 
      { status: 500 }
    );
  }
}
