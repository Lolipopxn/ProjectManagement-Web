import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const response = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json({ 
      user: response.data,
      token: token // ส่ง token กลับไปเพื่อใช้ในการสร้างโปรเจ็กต์
    });
  } catch (error: any) {
    console.error('Error fetching user:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || 'Failed to fetch user' }, 
      { status: error.response?.status || 500 }
    );
  }
}
