import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Project documentId is required' }, { status: 400 });
    }

    // ดึงข้อมูลโปรเจ็กต์โดย documentId พร้อมกับ relations ที่เกี่ยวข้อง
    // ใน Strapi v5 ต้องใช้ documentId แทน id
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/projects/${id}?populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.data?.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      project: response.data.data,
      success: true 
    });
  } catch (error: any) {
    console.error('Error fetching project:', error.response?.data || error.message);
    
    // Handle specific HTTP errors
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied to this project' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch project',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// PUT method for updating project by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Project documentId is required' }, { status: 400 });
    }

    // อัพเดทข้อมูลโปรเจ็กต์โดยใช้ documentId
    const response = await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/projects/${id}`,
      {
        data: updateData
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      project: response.data.data,
      success: true 
    });
  } catch (error: any) {
    console.error('Error updating project:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied to update this project' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to update project',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE method for deleting project by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Project documentId is required' }, { status: 400 });
    }

    // ลบโปรเจ็กต์โดยใช้ documentId
    await axios.delete(
      `${process.env.STRAPI_BASE_URL}/api/projects/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      success: true 
    });
  } catch (error: any) {
    console.error('Error deleting project:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied to delete this project' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to delete project',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
