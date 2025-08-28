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

    // Get query parameters for filtering, sorting, pagination
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const sortBy = searchParams.get('sortBy') || 'createdAt:desc';
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build query parameters
    let queryParams = `pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=${sortBy}&populate=*`;

    // Add filters
    const filters = [];
    if (search) {
      filters.push(`filters[project_name][$containsi]=${encodeURIComponent(search)}`);
    }
    if (status) {
      filters.push(`filters[project_status][$eq]=${encodeURIComponent(status)}`);
    }

    if (filters.length > 0) {
      queryParams += '&' + filters.join('&');
    }

    // ดึงข้อมูลโปรเจ็กต์ทั้งหมด
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/projects?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      projects: response.data.data,
      meta: response.data.meta,
      success: true 
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch projects',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
