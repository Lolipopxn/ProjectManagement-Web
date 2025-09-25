import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

// DELETE - ลบ submission ทั้งหมดของ user ใน task
export async function DELETE(request: NextRequest) {
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
        { success: false, message: 'Missing taskDocumentId' },
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

    // ดึงข้อมูล submissions ทั้งหมดเพื่อหา submissions ของ user นี้ใน task นี้
    const submissionsResponse = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/submissions?populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    if (!submissionsResponse.data?.data) {
      return NextResponse.json(
        { success: false, message: 'Could not fetch submissions' },
        { status: 500 }
      );
    }

    // กรองหา submissions ที่ตรงเงื่อนไข
    const userTaskSubmissions = submissionsResponse.data.data.filter((submission: any) => 
      submission.task_document_id === taskDocumentId && 
      submission.submitted_by_user_id_number === currentUser.id
    );

    console.log(`Found ${userTaskSubmissions.length} submissions to delete for user ${currentUser.id} in task ${taskDocumentId}`);

    // ลบทีละ submission
    let deletedCount = 0;
    const errors: string[] = [];

    for (const submission of userTaskSubmissions) {
      try {
        await axios.delete(
          `${process.env.STRAPI_BASE_URL}/api/submissions/${submission.documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );
        deletedCount++;
        console.log(`Deleted submission ${submission.documentId}`);
      } catch (deleteError: any) {
        console.error(`Failed to delete submission ${submission.documentId}:`, deleteError.response?.data || deleteError.message);
        errors.push(`Failed to delete submission ${submission.documentId}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      totalFound: userTaskSubmissions.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${deletedCount} out of ${userTaskSubmissions.length} submissions`
    });

  } catch (error: any) {
    console.error('Error in cancel-by-task:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel submissions', error: error.message },
      { status: 500 }
    );
  }
}
