import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const sortBy = searchParams.get('sortBy') || 'createdAt:desc';
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let currentUserId: number | null = null;

    //find user
    const userResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/users/me`,
      { headers }
    );

    const currentUser = userResponse.data;
    currentUserId = currentUser?.id;

    if (!currentUserId) {
      return NextResponse.json({ projects: [], meta: {}, success: true });
    }

    //project-members
    const projectMembersResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/project-members?filters[user_id_in_project][$eq]=${currentUserId}&populate=project`,
      { headers }
    );

    const projectMembers = projectMembersResponse.data.data;

    //project id
    const projectIds = projectMembers
      .map((pm: any) => pm?.project?.id)
      .filter(Boolean);

    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [], meta: {}, success: true });
    }

    //build query parameters
    let queryParams = `pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=${sortBy}&populate=*`;

    //filter my projects
    const projectFilter = projectIds
      .map((id: number, index: number) => `filters[id][$in][${index}]=${id}`)
      .join('&');

    queryParams += `&${projectFilter}`;

    if (search) {
      queryParams += `&filters[project_name][$containsi]=${encodeURIComponent(search)}`;
    }

    if (status) {
      queryParams += `&filters[project_status][$eq]=${encodeURIComponent(status)}`;
    }

    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/projects?${queryParams}`,
      { headers }
    );

    return NextResponse.json({
      projects: response.data.data,
      meta: response.data.meta,
      success: true,
    });

  } catch (error: any) {
    console.error('Error fetching projects:', error.response?.data || error.message);

    return NextResponse.json(
      {
        error: error.response?.data?.error?.message || 'Failed to fetch projects',
      },
      { status: error.response?.status || 500 }
    );
  }
}