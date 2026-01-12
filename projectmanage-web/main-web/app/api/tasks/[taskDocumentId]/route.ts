import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { fi } from 'date-fns/locale';

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
    const { 
      task_status, 
      assigned_to_user_ids_number, 
      task_name, 
      description, 
      due_date 
    } = body;

    // Validate at least one field is provided
    if (!task_status && !assigned_to_user_ids_number && !task_name && !description && !due_date) {
      return NextResponse.json({ 
        success: false, 
        message: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' 
      }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Prepare update data
    const updateData: any = {};
    
    // Update basic task information
    if (task_name) updateData.task_name = task_name;
    if (description !== undefined) updateData.description = description; // Allow empty string
    if (due_date) updateData.due_date = due_date;
    if (task_status) updateData.task_status = task_status;
    
    // Handle assigned user
    if (assigned_to_user_ids_number) {
      updateData.assigned_to_user_ids_number = assigned_to_user_ids_number;
      
      // Also update the relation field to connect to the user
      // Get user documentId first, then connect via relation
      try {
        const userDocumentId = await getUserDocumentIdById(assigned_to_user_ids_number, token);
        console.log(`Connecting task to user documentId: ${userDocumentId} (userId: ${assigned_to_user_ids_number})`);
        
        // For oneToMany relation, we need to disconnect previous users and connect the new one
        updateData.assigned_to_user_ids = {
          set: [userDocumentId] // Use 'set' to replace all existing connections
        };
      } catch (userError) {
        console.error('Error getting user documentId for relation:', userError);
        // Continue with just the number field update if relation fails
      }
    }

    console.log('Updating task with data:', JSON.stringify(updateData, null, 2));

    // อัปเดต Task ใน Strapi โดยใช้ documentId
    const response = await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${taskDocumentId}`,
      {
        data: updateData
      },
      { headers }
    );

    console.log('Task update response:', response.status, response.data);

    if (response.data) {
      return NextResponse.json({
        success: true,
        message: 'อัปเดต Task สำเร็จ',
        task: response.data.data
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่สามารถอัปเดต Task ได้' 
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
        message: 'เกิดข้อผิดพลาดในการอัปเดต Task' 
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
      { params: {
          filters: {
            documentId: taskDocumentId,
          },
          populate: {
            assigned_to_user_ids: {
              fields: ['id', 'username', 'email'],
            },
            task_status_histories: {
                fields: ['id', 'from_status', 'to_status', 'changed_at', 'note'],
              },
            },
        },
        headers
      },
        
      
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

export async function DELETE(
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

    // ลบ Task จาก Strapi โดยใช้ documentId
    const response = await axios.delete(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${taskDocumentId}`,
      { headers }
    );

    console.log('Task delete response:', response.status);

    return NextResponse.json({
      success: true,
      message: 'ลบ Task สำเร็จ'
    });

  } catch (error: any) {
    console.error('Error deleting task:', error);
    
    if (error.response?.status === 404) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบ Task ที่ระบุ' 
      }, { status: 404 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ 
        success: false, 
        message: 'คุณไม่มีสิทธิ์ในการลบ Task นี้' 
      }, { status: 403 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการลบ Task' 
      }, { status: 500 });
    }
  }
}
