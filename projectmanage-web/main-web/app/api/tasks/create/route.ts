import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      task_name, 
      description, 
      due_date, 
      project_document_id, 
      project_id_number,
      assigned_to_user_ids_number,
      task_status = 'not turn in'
    } = body;

    // Validate required fields
    if (!task_name || !project_document_id || !project_id_number) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create task in Strapi
    const strapiResponse = await axios.post(
      'http://localhost:1337/api/tasks',
      {
        data: {
          task_name,
          description: description || '',
          task_status,
          due_date,
          project_document_id,
          project_id_number: parseInt(project_id_number),
          assigned_to_user_ids_number: assigned_to_user_ids_number ? parseInt(assigned_to_user_ids_number) : null
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (strapiResponse.status === 200 || strapiResponse.status === 201) {
      return NextResponse.json({
        success: true,
        task: strapiResponse.data.data,
        message: 'Task created successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create task in Strapi' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error creating task:', error);
    
    if (error.response) {
      console.error('Strapi error response:', error.response.data);
      return NextResponse.json(
        { 
          success: false, 
          message: error.response.data?.error?.message || 'Failed to create task',
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
