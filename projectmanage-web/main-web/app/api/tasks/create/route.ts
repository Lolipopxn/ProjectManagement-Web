import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

// helper: ดึง documentId ของ user จาก numeric id (users-permissions)
async function getUserDocumentIdById(userId: number, token: string) {
  try {
    // ขอเฉพาะ field documentId ก็พอ (ลด payload)
    const res = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/users/${userId}?fields=documentId`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // ให้เช็ค res.data.documentId
    const docId = res.data?.documentId;
    if (!docId) {
      throw new Error(`Cannot resolve documentId for user id=${userId}`);
    }
    return docId;
  } catch (error) {
    console.error('Error fetching user documentId:', error);
    throw error;
  }
}

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

    const body = await request.json();
    const { 
      task_name, 
      description, 
      due_date,
      begin_date, 
      task_color,
      project_document_id, 
      project_id_number,
      assigned_to_user_ids_number,
      task_status = 'not turn in',
      task_type = 'normal_task',
    } = body;

    // Validate required fields
    if (!task_name || !project_document_id || !project_id_number) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูล task พื้นฐาน
    const taskData: any = {
      task_name,
      description: description || '',
      task_status,
      task_type,
      due_date,
      begin_date,
      task_color,
      project_document_id,
      project_id_number: parseInt(project_id_number),
      assigned_to_user_ids_number: assigned_to_user_ids_number ? parseInt(assigned_to_user_ids_number) : null,
      publishedAt: new Date().toISOString(),
      // relations
      project_id: { connect: [project_document_id] },
    };

    // เพิ่ม user relation ถ้ามีการมอบหมาย
    if (assigned_to_user_ids_number) {
      const userDocumentId = await getUserDocumentIdById(parseInt(assigned_to_user_ids_number), token);
      taskData.assigned_to_user_ids = { connect: [userDocumentId] };
    }

    console.log('Task payload:', taskData);

    // Create task in Strapi
    const strapiResponse = await axios.post(
      'http://localhost:1337/api/tasks',
      {
        data: taskData
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
        task: strapiResponse.data.data,
        message: 'Task created successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create task in Strapi' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error creating task:', error);
    
    if (error.response) {
      console.error('Strapi error response:', error.response.data);
      return NextResponse.json(
        { 
          success: false, 
          message: error.response.data?.error?.message || 'Failed to create task',
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
