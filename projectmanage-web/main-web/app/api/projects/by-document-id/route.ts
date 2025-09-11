import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectDocumentId = searchParams.get('documentId');

    if (!projectDocumentId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Project document ID is required' 
        },
        { status: 400 }
      );
    }

    // ดึงข้อมูลโปรเจ็กต์จาก Strapi โดยใช้ documentId
    const projectResponse = await axios.get(`${STRAPI_BASE_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      params: {
        'filters[documentId][$eq]': projectDocumentId
      }
    });

    if (projectResponse.data?.data?.[0]) {
      const project = projectResponse.data.data[0];
      
      const formattedProject = {
        id: project.id,
        documentId: project.documentId,
        project_name: project.attributes.project_name,
        description: project.attributes.description,
        project_status: project.attributes.project_status,
        start_date: project.attributes.start_date,
        end_date: project.attributes.end_date,
        created_by_user_id: project.attributes.created_by_user_id,
        created_by_user: project.attributes.created_by_user,
        createdAt: project.attributes.createdAt,
        updatedAt: project.attributes.updatedAt
      };

      return NextResponse.json({
        success: true,
        project: formattedProject
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Project not found' 
        },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('Error fetching project by documentId:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch project',
        error: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
