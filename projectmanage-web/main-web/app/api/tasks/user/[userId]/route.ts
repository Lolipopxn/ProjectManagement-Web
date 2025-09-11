import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params;
    const userId = parseInt(userIdStr);

    if (isNaN(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid user ID' 
        },
        { status: 400 }
      );
    }

    // ดึงข้อมูล tasks จาก Strapi ที่ assigned ให้ user นี้
    console.log(`Fetching tasks for user ID: ${userId}`);
    
    const tasksResponse = await axios.get(`${STRAPI_BASE_URL}/api/tasks`, {
      params: {
        'filters[assigned_to_user_ids_number][$eq]': userId,
        'populate': '*'
      }
    });

    console.log('Number of raw tasks:', tasksResponse.data?.data?.length || 0);

    if (tasksResponse.data && tasksResponse.data.data) {
      const tasks = tasksResponse.data.data;
      
      // แปลงข้อมูลจาก Strapi format เป็น format ที่ใช้งาน
      const formattedTasks = await Promise.all(
        tasks.map(async (task: any) => {
          let projectInfo = null;
          
          // ตรวจสอบว่า task มีข้อมูลและ project_document_id
          if (task && task.project_document_id) {
            try {
              // ใช้ Strapi API โดยตรงแทนการเรียก internal API
              const projectResponse = await axios.get(`${STRAPI_BASE_URL}/api/projects`, {
                params: {
                  'filters[documentId][$eq]': task.project_document_id
                }
              });

              if (projectResponse.data?.data?.[0]) {
                const project = projectResponse.data.data[0];
                projectInfo = {
                  id: project.id,
                  project_name: project.project_name || 'Unknown Project',
                  documentId: project.documentId
                };
              }
            } catch (error) {
              console.error('Error fetching project info:', error);
            }
          }

          return {
            id: task.id,
            task_name: task.task_name || 'Unknown Task',
            description: task.description || '',
            due_date: task.due_date || null,
            task_status: task.task_status || 'pending',
            project_document_id: task.project_document_id || null,
            project_id_number: task.project_id_number || null,
            assigned_to_user_ids_number: task.assigned_to_user_ids_number || null,
            createdAt: task.createdAt || null,
            updatedAt: task.updatedAt || null,
            project: projectInfo
          };
        })
      );

      return NextResponse.json({
        success: true,
        tasks: formattedTasks,
        totalTasks: formattedTasks.length
      });
    } else {
      return NextResponse.json({
        success: true,
        tasks: [],
        totalTasks: 0
      });
    }

  } catch (error: any) {
    console.error('Error fetching user tasks:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch user tasks',
        error: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
