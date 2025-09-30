import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // รับข้อมูลจาก request body
    const projectData = await request.json();

    // ดึงข้อมูล user ปัจจุบัน
    const userResponse = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const currentUser = userResponse.data;

    // เตรียมข้อมูลสำหรับสร้างโปรเจ็กต์ - รวม user ID และ relations
    const projectPayload = {
      project_name: projectData.project_name,
      description: projectData.description,
      start_date: projectData.start_date,
      end_date: projectData.end_date,
      project_status: projectData.project_status,
      created_by_user: currentUser.id, // ใส่ user ID ของผู้สร้างลงในฟิลด์ใหม่
      slug: projectData.slug,
      // เพิ่ม relation สำหรับ created_by_user_id
      created_by_user_id: { connect: [currentUser.documentId] }
    };

    console.log('Creating project with payload:', projectPayload); // Debug log
    console.log('User making request:', currentUser); // Debug log

    // สร้างโปรเจ็กต์ใหม่ก่อนโดยไม่มี relation
    const response = await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/projects`,
      {
        data: projectPayload
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Project created successfully:', response.data); // Debug log

    // ไม่สร้าง project member ที่นี่ เพราะจะถูกจัดการในหน้า create project แล้ว
    return NextResponse.json({ 
      project: response.data,
      success: true 
    });
  } catch (error: any) {
    console.error('Error creating project:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to create project',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
