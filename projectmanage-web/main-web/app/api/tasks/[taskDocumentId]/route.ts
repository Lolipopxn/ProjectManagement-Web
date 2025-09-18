import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskDocumentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ token การเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const { taskDocumentId } = await params;
    const body = await request.json();
    const { task_status } = body;

    if (!task_status) {
      return NextResponse.json({ 
        success: false, 
        message: 'กรุณาระบุสถานะ Task' 
      }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // อัปเดตสถานะ Task ใน Strapi โดยใช้ documentId
    const response = await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${taskDocumentId}`,
      {
        data: {
          task_status: task_status
        }
      },
      { headers }
    );

    if (response.data) {
      return NextResponse.json({
        success: true,
        message: 'อัปเดตสถานะ Task สำเร็จ',
        task: response.data.data
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่สามารถอัปเดตสถานะ Task ได้' 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error updating task status:', error);
    
    if (error.response?.status === 404) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ Task ที่ระบุ' 
      }, { status: 404 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ 
        success: false, 
        message: 'คุณไม่มีสิทธิ์ในการอัปเดต Task นี้' 
      }, { status: 403 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ Task' 
      }, { status: 500 });
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskDocumentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ token การเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const { taskDocumentId } = await params;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // ดึงข้อมูล Task จาก Strapi โดยใช้ documentId
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${taskDocumentId}`,
      { headers }
    );

    if (response.data) {
      return NextResponse.json({
        success: true,
        task: response.data.data
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ Task ที่ระบุ' 
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Error fetching task:', error);
    
    if (error.response?.status === 404) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ Task ที่ระบุ' 
      }, { status: 404 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ 
        success: false, 
        message: 'คุณไม่มีสิทธิ์ในการเข้าถึง Task นี้' 
      }, { status: 403 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Task' 
      }, { status: 500 });
    }
  }
}
