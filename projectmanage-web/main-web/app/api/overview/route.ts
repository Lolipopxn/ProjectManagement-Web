import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

interface Project {
  id: number;
  documentId?: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user: number;
  userRole?: string;
  created_by_user_info?: any;
}

interface ProjectMember {
  project_id_number: number;
  role_in_project: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const userResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/users/me`,
      { headers }
    );

    const currentUser = userResponse.data;
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [projectsResponse, projectMembersResponse] = await Promise.all([
      axios.get(
        `${process.env.STRAPI_BASE_URL}/api/projects?populate=*`,
        { headers }
      ),
      axios.get(
        `${process.env.STRAPI_BASE_URL}/api/project-members?filters[user_id_in_project][$eq]=${currentUser.id}`,
        { headers }
      ),
    ]);

    const allProjects: Project[] = projectsResponse.data.data || [];
    const projectMembers: ProjectMember[] = projectMembersResponse.data.data || [];

    const roleMap = new Map<number, string>();
    projectMembers.forEach(m => {
      roleMap.set(m.project_id_number, m.role_in_project);
    });

    const userProjectIds = projectMembers.map(m => m.project_id_number);

    const userOwnProjects = allProjects
      .filter(p => userProjectIds.includes(p.id))
      .map(project => ({
        ...project,
        userRole: roleMap.get(project.id) || "member",
        created_by_user_info: project.created_by_user || null,
      }));

    const stats = {
      totalProjects: userOwnProjects.length,
      activeProjects: userOwnProjects.filter(
        p => p.project_status === "active" || p.project_status === "in-progress"
      ).length,
      completedProjects: userOwnProjects.filter(
        p => p.project_status === "completed"
      ).length,
      pendingProjects: userOwnProjects.filter(
        p => p.project_status === "on-hold" || p.project_status === "planning"
      ).length,
    };

    return NextResponse.json({
      user: currentUser,
      projects: allProjects,
      userOwnProjects,
      stats,
    });

  } catch (error: any) {
    if (error.response?.status === 401) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    if (error.response?.status === 403) {
      return NextResponse.json({ error: "Access forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch overview data", details: error.message },
      { status: 500 }
    );
  }
}
