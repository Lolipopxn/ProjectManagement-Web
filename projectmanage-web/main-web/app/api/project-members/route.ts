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

// POST - เพิ่มสมาชิกใหม่
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      project_document_id, 
      project_id_number, 
      user_id_in_project, 
      role_in_project = 'Member' 
    } = body;

    // Validate required fields
    if (!project_document_id || !project_id_number || !user_id_in_project) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // เพิ่มสมาชิกใหม่
    const response = await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/project-members`,
      {
        data: {
          project_document_id,
          project_id_number: parseInt(project_id_number),
          user_id_in_project: parseInt(user_id_in_project),
          role_in_project,
          join_date: new Date().toISOString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      projectMember: response.data.data,
      success: true,
      message: 'Member added successfully'
    });
  } catch (error: any) {
    console.error('Error adding project member:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to add project member',
        details: error.response?.data,
        success: false
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE - ลบสมาชิก
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Member ID is required' },
        { status: 400 }
      );
    }

    // ลบสมาชิก
    await axios.delete(
      `${process.env.STRAPI_BASE_URL}/api/project-members/${memberId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing project member:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to remove project member',
        details: error.response?.data,
        success: false
      }, 
      { status: error.response?.status || 500 }
    );
  }
}