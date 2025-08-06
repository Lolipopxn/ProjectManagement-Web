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
    try {
      const userResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
        headers
      });
      const currentUser = userResponse.data;

      if (currentUser) {
        // ดึงโปรเจ็กต์ที่ user เป็นสมาชิก
        const projectMembersResponse = await axios.get(
          `${process.env.STRAPI_BASE_URL}/api/project-members?filters[user_id_in_project][$eq]=${currentUser.id}`, 
          { headers }
        );

        const projectsResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/projects`, {
          headers
        });

        const allProjects = projectsResponse.data.data || [];
        const userProjectMembers = projectMembersResponse.data.data || [];

        // กรองโปรเจ็กต์ที่ user เป็นสมาชิก
        const userProjectIds = userProjectMembers.map((member: any) => member.project_id_number);
        projects = allProjects.filter((project: any) => userProjectIds.includes(project.id));

        console.log('Sidebar API - User project IDs:', userProjectIds);
        console.log('Sidebar API - Filtered projects:', projects.length);
      }
    } catch (projectError) {
      console.error('Failed to fetch projects for sidebar:', projectError);
    }

    // ดึงข้อมูล tasks ที่เกี่ยวข้องกับโปรเจ็กต์ที่ user เป็นสมาชิก
    try {
      if (projects.length > 0) {
        const tasksResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/tasks?populate=project`, {
          headers
        });
        const allTasks = tasksResponse.data.data || [];
        
        // กรอง tasks ที่เป็นของโปรเจ็กต์ที่ user เป็นสมาชิก
        const userProjectIds = projects.map((project: any) => project.id);
        tasks = allTasks.filter((task: any) => {
          const taskProjectId = task.project?.id;
          return userProjectIds.includes(taskProjectId);
        });

        console.log('Sidebar API - User tasks count:', tasks.length);
      }
    } catch (taskError) {
      console.error('Failed to fetch tasks for sidebar:', taskError);
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
