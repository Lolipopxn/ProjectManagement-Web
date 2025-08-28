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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectDocumentId = searchParams.get('projectDocumentId');
    const assignedUserId = searchParams.get('assignedUserId');
    const taskStatus = searchParams.get('status');

    // Build query parameters
    let queryParams = 'populate=*';
    const filters = [];

    if (projectDocumentId) {
      filters.push(`filters[project_document_id][$eq]=${encodeURIComponent(projectDocumentId)}`);
    }
    if (assignedUserId) {
      filters.push(`filters[assigned_to_user_ids_number][$eq]=${assignedUserId}`);
    }
    if (taskStatus) {
      filters.push(`filters[task_status][$eq]=${encodeURIComponent(taskStatus)}`);
    }

    if (filters.length > 0) {
      queryParams += '&' + filters.join('&');
    }

    console.log('Fetching tasks with query:', queryParams);

    // ดึงข้อมูล tasks
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/tasks?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Tasks response:', response.data);

    return NextResponse.json({ 
      tasks: response.data.data,
      meta: response.data.meta,
      success: true 
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch tasks',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
