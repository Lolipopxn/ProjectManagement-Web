import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;

// helper: ดึง documentId ของ user จาก numeric id (users-permissions)
// กรณีคุณมีแต่ user_id_in_project (เลข id เดิม)
async function getUserDocumentIdById(userId: number, token: string) {
  // Strapi v5 (users-permissions) รองรับ path /api/users/:id
  // ขอเฉพาะ field documentId ก็พอ (ลด payload)
  const res = await axios.get(
    `${STRAPI_BASE_URL}/api/users/${userId}?fields=documentId`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  // รูปแบบของ /api/users จะคืน object ตรงๆ (ไม่ห่อด้วย {data:{}})
  // ให้เช็ค res.data.documentId
  const docId = res.data?.documentId;
  if (!docId) {
    throw new Error(`Cannot resolve documentId for user id=${userId}`);
  }
  return docId as string;
}


export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { project_id_number, user_id_in_project, role_in_project, join_date, project_document_id, user_document_id } = await request.json();

    if (!project_id_number || !user_id_in_project || !role_in_project || !project_document_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: project_id_number, user_id_in_project, role_in_project, project_document_id' 
      }, { status: 400 });
    }

    console.log('Creating project member with new fields:', { 
      project_id_number, 
      user_id_in_project, 
      role_in_project,
      join_date,
      project_document_id,
    });

    let userDocId: string | null = null;

    if (project_document_id && typeof user_document_id === 'string') {
      userDocId = user_document_id;
    } else if (user_id_in_project) {
      // resolve documentId จาก numeric id ของ user
      userDocId = await getUserDocumentIdById(Number(user_id_in_project), token);
    } else {
      return NextResponse.json(
        { error: 'Missing user identifier: provide user_document_id or user_id_in_project' },
        { status: 400 }
      );
    }

    // สร้าง project member โดยใช้ field ใหม่ แทน relations
    const projectMemberData = {
      project_id_number: project_id_number,
      user_id_in_project: user_id_in_project,
      role_in_project: role_in_project,
      join_date: join_date || new Date().toISOString(),
      project_document_id: project_document_id, // เพิ่ม document ID
      publishedAt: new Date().toISOString(),
      //relations
      project: { connect: [project_document_id] },
      user: { connect: [user_id_in_project] },
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
