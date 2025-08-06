import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { project_id_number, user_id_in_project, role_in_project, join_date } = await request.json();

    if (!project_id_number || !user_id_in_project || !role_in_project) {
      return NextResponse.json({ 
        error: 'Missing required fields: project_id_number, user_id_in_project, role_in_project' 
      }, { status: 400 });
    }

    console.log('Creating project member with new fields:', { 
      project_id_number, 
      user_id_in_project, 
      role_in_project,
      join_date 
    });

    // สร้าง project member โดยใช้ field ใหม่ แทน relations
    const projectMemberData = {
      project_id_number: project_id_number,
      user_id_in_project: user_id_in_project,
      role_in_project: role_in_project,
      join_date: join_date || new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    console.log('Project member payload:', projectMemberData);

    // สร้าง project member
    const response = await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/project-members`,
      {
        data: projectMemberData
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Project member created successfully:', response.data);

    return NextResponse.json({ 
      projectMember: response.data,
      success: true,
      message: 'Project member created successfully with new fields'
    });
  } catch (error: any) {
    console.error('Error creating project member:', error.response?.data || error.message);
    console.error('Full error:', error);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to create project member',
        details: error.response?.data,
        fullError: error.message,
        status: error.response?.status
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
