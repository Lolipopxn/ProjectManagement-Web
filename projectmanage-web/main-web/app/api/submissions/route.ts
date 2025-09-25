import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

// ฟังก์ชันสำหรับหา user documentId จาก user ID
async function getUserDocumentIdById(userId: number, token: string): Promise<string> {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    return response.data.documentId || response.data.id.toString();
  } catch (error) {
    console.error('Error fetching user documentId:', error);
    return userId.toString(); // fallback ใช้ ID แทน
  }
}

// GET - ดึงข้อมูล submissions ของ task
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskDocumentId = searchParams.get('taskDocumentId');

    if (!taskDocumentId) {
      return NextResponse.json(
        { success: false, message: 'Missing taskDocumentId parameter' },
        { status: 400 }
      );
    }

    // ดึง submissions จาก Strapi พร้อม populate relations
    const response = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/submissions?populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data && response.data.data) {
      // กรอง submissions ที่เป็นของ task นี้
      const taskSubmissions = response.data.data.filter((submission: any) => {
        return submission.task_document_id === taskDocumentId;
      });

      return NextResponse.json({
        success: true,
        submissions: taskSubmissions
      });
    } else {
      return NextResponse.json({
        success: true,
        submissions: []
      });
    }

  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - สร้าง submission ใหม่
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const userResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    if (!userResponse.data) {
      return NextResponse.json(
        { success: false, message: 'Could not fetch user data' },
        { status: 401 }
      );
    }

    const currentUser = userResponse.data;
    const body = await request.json();
    const { 
      task_document_id,
      task_id_number,
      comments,
      file_url
    } = body;

    // Validate required fields
    if (!task_document_id || !task_id_number) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // หา user documentId สำหรับการทำ relation
    const userDocumentId = await getUserDocumentIdById(currentUser.id, token);

    // สร้าง submission ใน Strapi
    const submissionData = {
      task_document_id,
      task_id_number: parseInt(task_id_number),
      submitted_by_user_id_number: currentUser.id,
      submission_date: new Date().toISOString(),
      comments: comments || '',
      file_url: file_url || null,
      publishedAt: new Date().toISOString(),
      // เพิ่ม relations เหมือนการสร้าง project member
      task_id: { connect: [task_document_id] },
      submitted_by_user_id: { connect: [userDocumentId] }
    };

    console.log('Submission payload:', submissionData);

    const strapiResponse = await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/submissions`,
      {
        data: submissionData
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (strapiResponse.status === 200 || strapiResponse.status === 201) {
      return NextResponse.json({
        success: true,
        submission: strapiResponse.data.data,
        message: 'Submission created successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create submission' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error creating submission:', error);
    
    if (error.response) {
      console.error('Strapi error response:', error.response.data);
      return NextResponse.json(
        { 
          success: false, 
          message: error.response.data?.error?.message || 'Failed to create submission',
          details: error.response.data
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
