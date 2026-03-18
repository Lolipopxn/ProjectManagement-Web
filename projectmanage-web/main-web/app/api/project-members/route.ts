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
    const projectDocumentId = searchParams.get('projectDocumentId');
    const projectIdNumber = searchParams.get('projectIdNumber');
    const userId = searchParams.get('userId');

    // Build query parameters
    let queryParams = 'populate=*';
    const filters = [];

    if (projectDocumentId) {
      filters.push(`filters[project_document_id][$eq]=${encodeURIComponent(projectDocumentId)}`);
    }
    if (projectIdNumber) {
      filters.push(`filters[project_id_number][$eq]=${projectIdNumber}`);
    }
    if (userId) {
      filters.push(`filters[user_id_in_project][$eq]=${userId}`);
    }

    if (filters.length > 0) {
      queryParams += '&' + filters.join('&');
    }

    const url = `${process.env.STRAPI_BASE_URL}/api/project-members?${queryParams}`;
    console.log('Fetching project members from:', url);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    if (response.data && response.data.data) {
      return NextResponse.json({
        success: true,
        projectMembers: response.data.data,
        pagination: response.data.meta?.pagination
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No project members found',
        projectMembers: []
      });
    }

  } catch (error: any) {
    console.error('Error fetching project members:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to fetch project members',
        details: error.response?.data,
        success: false
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// POST - เพิ่มสมาชิกใหม่
// helper: ดึง documentId ของ user จาก numeric id (users-permissions)
async function getUserDocumentIdById(userId: number, token: string) {
  const res = await axios.get(
    `${process.env.STRAPI_BASE_URL}/api/users/${userId}?fields=documentId`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const docId = res.data?.documentId;
  if (!docId) {
    throw new Error(`Cannot resolve documentId for user id=${userId}`);
  }
  return docId as string;
}

// helper: ดึง documentId ของ project จาก numeric id
async function getProjectDocumentIdById(projectId: number, token: string) {
  const res = await axios.get(
    `${process.env.STRAPI_BASE_URL}/api/projects/${projectId}?fields=documentId`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const docId = res.data?.data?.documentId;
  if (!docId) {
    throw new Error(`Cannot resolve documentId for project id=${projectId}`);
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

    const requestBody = await request.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));
    
    const { 
      project_id_number, 
      user_id_in_project, 
      role_in_project, 
      join_date, 
      project_document_id, 
      user_document_id
    } = requestBody;

    // Validate required fields
    console.log('Field validation:', {
      project_id_number: !!project_id_number,
      user_id_in_project: !!user_id_in_project,
      role_in_project: !!role_in_project,
      project_document_id: !!project_document_id
    });

    if (!project_id_number || !user_id_in_project || !role_in_project || !project_document_id) {
      console.error('Missing required fields:', {
        project_id_number,
        user_id_in_project,
        role_in_project,
        project_document_id
      });
      return NextResponse.json({ 
        error: 'Missing required fields: project_id_number, user_id_in_project, role_in_project, project_document_id',
        received: requestBody
      }, { status: 400 });
    }

    console.log('Creating project member with fields:', { 
      project_id_number, 
      user_id_in_project, 
      role_in_project,
      join_date,
      project_document_id
    });

    let userDocId: string | null = null;
    let projectDocId: string = project_document_id;

    // Resolve user documentId
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

    // Resolve project documentId if not provided
    if (!project_document_id && project_id_number) {
      projectDocId = await getProjectDocumentIdById(Number(project_id_number), token);
    }

    // สร้าง project member ตาม schema ที่ถูกต้อง
    const projectMemberData = {
      // Required fields ตาม schema
      role_in_project: role_in_project,
      join_date: join_date || new Date().toISOString(),
      project_id_number: project_id_number,
      user_id_in_project: user_id_in_project,
      project_document_id: projectDocId,
      // role enumeration (required ใน schema)
      role: role_in_project === 'Leader' ? 'owner' : role_in_project === 'Admin' ? 'admin' : 'member',
      // relations - ใช้ documentId สำหรับ connections
      project: { connect: [projectDocId] },
      user: { connect: [userDocId] }
    };

    console.log('Project member payload:', projectMemberData);
    console.log('Relations data:', {
      project_connect: projectDocId,
      user_connect: userDocId,
      resolved_from_user_id: user_id_in_project,
      original_project_document_id: project_document_id
    });

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
      message: 'Project member created successfully with relations'
    });
  } catch (error: any) {
    console.error('Error creating project member:', error.response?.data || error.message);
    console.error('Full error:', error);
    console.error('Status:', error.response?.status);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || 'Failed to create project member',
        details: error.response?.data,
        fullError: error.message,
        status: error.response?.status,
        success: false
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE - ลบสมาชิก
export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE PROJECT MEMBER API ===');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const userDocumentId = searchParams.get('userDocumentId');
    const projectDocumentId = searchParams.get('projectDocumentId');
    
    console.log('Parameters:', { memberId, userDocumentId, projectDocumentId });

    let deleteUrl = '';

    // Method 1: Direct deletion using memberId (documentId)
    if (memberId) {
      deleteUrl = `${process.env.STRAPI_BASE_URL}/api/project-members/${memberId}`;
      console.log('Using direct member ID deletion:', deleteUrl);
    }
    // Method 2: Find member by project and user, then delete
    else if (projectDocumentId && userDocumentId) {
      console.log('Finding member by project and user...');
      
      // Get all members for this project
      const findUrl = `${process.env.STRAPI_BASE_URL}/api/project-members?filters[project_document_id][$eq]=${projectDocumentId}`;
      console.log('Query URL:', findUrl);
      
      const findResponse = await axios.get(findUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Found members:', findResponse.data.data?.length || 0);
      console.log('Members data:', findResponse.data.data);
      
      if (!findResponse.data.data || findResponse.data.data.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No members found for this project' },
          { status: 404 }
        );
      }
      
      // Find the member that matches our user
      let targetMember = null;
      
      // Try to match by user_id_in_project (numeric comparison)
      const numericUserId = parseInt(userDocumentId);
      if (!isNaN(numericUserId)) {
        targetMember = findResponse.data.data.find((member: any) => 
          member.user_id_in_project === numericUserId
        );
        console.log('Found by numeric user ID:', !!targetMember);
      }
      
      // If not found by numeric, try string comparison
      if (!targetMember) {
        targetMember = findResponse.data.data.find((member: any) => 
          String(member.user_id_in_project) === String(userDocumentId)
        );
        console.log('Found by string user ID:', !!targetMember);
      }
      
      if (!targetMember) {
        console.log('Available members:', findResponse.data.data.map((m: any) => ({
          id: m.id,
          documentId: m.documentId,
          user_id_in_project: m.user_id_in_project
        })));
        return NextResponse.json(
          { success: false, message: `Member with user ID ${userDocumentId} not found in project` },
          { status: 404 }
        );
      }
      
      deleteUrl = `${process.env.STRAPI_BASE_URL}/api/project-members/${targetMember.documentId || targetMember.id}`;
      console.log('Found target member, delete URL:', deleteUrl);
    }
    else {
      return NextResponse.json(
        { success: false, message: 'Either memberId or (projectDocumentId + userDocumentId) is required' },
        { status: 400 }
      );
    }

    // Execute deletion
    console.log('Executing DELETE request to:', deleteUrl);
    const deleteResponse = await axios.delete(deleteUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Delete response status:', deleteResponse.status);
    console.log('Member deleted successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error: any) {
    console.error('=== DELETE ERROR ===');
    console.error('Error removing project member:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Full error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to remove project member'
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// PUT - change role member
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, role_in_project } = body;

    if (!memberId || !role_in_project) {
      return NextResponse.json(
        { success: false, message: 'Missing memberId or role_in_project' },
        { status: 400 }
      );
    }

    console.log('Updating member role:', { memberId, role_in_project });

    const response = await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/project-members/${memberId}`,
      {
        data: {
          role_in_project,
          role:
            role_in_project === 'Leader'
              ? 'owner'
              : 'member', // map ตาม schema คุณ
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error updating role:', error.response?.data || error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.error?.message || 'Update failed',
      },
      { status: error.response?.status || 500 }
    );
  }
}
