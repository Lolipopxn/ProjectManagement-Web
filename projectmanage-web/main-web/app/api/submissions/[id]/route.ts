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
