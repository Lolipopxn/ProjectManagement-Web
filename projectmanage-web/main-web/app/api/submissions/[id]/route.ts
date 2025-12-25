import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

// DELETE - ลบ submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing submission ID' },
        { status: 400 }
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

    // ดึงข้อมูล submission เพื่อตรวจสอบสิทธิ์
    const submissionResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/submissions/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!submissionResponse.data || !submissionResponse.data.data) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionResponse.data.data;

    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ submission หรือไม่
    if (submission.submitted_by_user_id_number !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own submissions' },
        { status: 403 }
      );
    }

    // ลบ submission
    await axios.delete(
      `${process.env.STRAPI_BASE_URL}/api/submissions/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting submission:', error);
    
    if (error.response) {
      console.error('Strapi error response:', error.response.data);
      return NextResponse.json(
        { 
          success: false, 
          message: error.response.data?.error?.message || 'Failed to delete submission',
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

// PUT - อัปเดต submission (เช่น set is_active = false)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing submission ID' },
        { status: 400 }
      );
    }

    // อ่าน body ของ request
    const body = await request.json();

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

    // ดึงข้อมูล submission เพื่อตรวจสอบสิทธิ์
    const submissionResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/submissions/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!submissionResponse.data || !submissionResponse.data.data) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionResponse.data.data;

    // ดึงข้อมูล task เพื่อหา project
    let isLeader = false;
    if (submission.task_document_id) {
      try {
        // ใช้ task_document_id แทน task_id_number
        const taskResponse = await axios.get(
          `${process.env.STRAPI_BASE_URL}/api/tasks/${submission.task_document_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );

        if (taskResponse.data?.data?.project_document_id) {
          // ใช้ project_document_id แทน project_id_number
          const projectResponse = await axios.get(
            `${process.env.STRAPI_BASE_URL}/api/projects/${taskResponse.data.data.project_document_id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );

          // ตรวจสอบว่าเป็น project leader หรือไม่
          if (projectResponse.data?.data) {
            const project = projectResponse.data.data;
            isLeader = project.created_by_user === currentUser.id || 
                      project.created_by_user_id === currentUser.id;
            
            console.log('Leader check:', {
              currentUserId: currentUser.id,
              projectCreator: project.created_by_user || project.created_by_user_id,
              isLeader
            });
          }
        }
      } catch (projectError) {
        console.log('Could not check project leader status:', projectError);
      }
    }

    // ตรวจสอบสิทธิ์: เจ้าของ submission หรือ project leader
    if (submission.submitted_by_user_id_number !== currentUser.id && !isLeader) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own submissions or submissions in your project (if you are the leader)' },
        { status: 403 }
      );
    }

    // อัปเดต submission
    const updateResponse = await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/submissions/${id}`,
      {
        data: body
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Submission updated successfully',
      data: updateResponse.data.data
    });

  } catch (error: any) {
    console.error('Error updating submission:', error);
    
    if (error.response) {
      console.error('Strapi error response:', error.response.data);
      return NextResponse.json(
        { 
          success: false, 
          message: error.response.data?.error?.message || 'Failed to update submission',
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
