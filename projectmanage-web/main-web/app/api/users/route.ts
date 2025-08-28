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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // ดึงข้อมูลผู้ใช้ตาม ID
      const response = await axios.get(
        `${process.env.STRAPI_BASE_URL}/api/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return NextResponse.json({ 
        user: response.data,
        success: true 
      });
    } else {
      // ดึงรายการผู้ใช้ทั้งหมด
      const response = await axios.get(
        `${process.env.STRAPI_BASE_URL}/api/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return NextResponse.json({ 
        users: response.data,
        success: true 
      });
    }
  } catch (error: any) {
    console.error('Error fetching users:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch users',
        details: error.response?.data 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
