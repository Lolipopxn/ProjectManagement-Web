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
    const projectIdNumber = searchParams.get('projectIdNumber');
    const userId = searchParams.get('userId');

    // Build query parameters
    let queryParams = 'populate=*';
    const filters = [];

    if (projectDocumentId) {
      filters.push(`filters[project_document_id][$eq]=${encodeURIComponent(projectDocumentId)}`);
    }
    if (projectIdNumber) {
      filters.push(`filters[project_id_number][$eq]=${projectIdNumber}`);
    }
    if (userId) {
      filters.push(`filters[user_id_in_project][$eq]=${userId}`);
    }

    if (filters.length > 0) {
      queryParams += '&' + filters.join('&');
    }

    // ดึงข้อมูล project members
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/project-members?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      projectMembers: response.data.data,
      meta: response.data.meta,
      success: true 
    });
  } catch (error: any) {
    console.error('Error fetching project members:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch project members',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}