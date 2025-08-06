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

    // ทดสอบการเชื่อมต่อ Strapi
    const strapiTest = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/project-members`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      strapi_connection: 'OK',
      project_members_count: strapiTest.data?.data?.length || 0,
      sample_data: strapiTest.data?.data?.[0] || null
    });
  } catch (error: any) {
    console.error('Strapi connection test failed:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Strapi connection failed',
        details: error.response?.data,
        message: error.message
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // ทดสอบการสร้าง project member ง่ายๆ
    const testData = {
      project_id_number: 1,
      user_id_in_project: 1,
      role_in_project: 'test',
      join_date: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    console.log('Testing project member creation:', testData);

    const response = await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/project-members`,
      {
        data: testData
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
      message: 'Test project member created',
      data: response.data
    });
  } catch (error: any) {
    console.error('Test project member creation failed:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.response?.data,
        message: error.message,
        status: error.response?.status
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
