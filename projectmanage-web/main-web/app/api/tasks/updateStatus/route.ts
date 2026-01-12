import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    const { documentId, task_status, note } = await req.json();

    const token = ( await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const taskRes = await axios.get(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${documentId}`,
      { headers }
    );

    const oldStatus =
      taskRes.data?.data?.task_status;

    await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${documentId}`,
      {
        data: {
          task_status,
        },
      },
      { headers }
    );

    await axios.post(
      `${process.env.STRAPI_BASE_URL}/api/task-status-histories`,
      {
        data: {
          task: taskRes.data.data.id,
          from_status: oldStatus,
          to_status: task_status,
          changed_at: new Date().toISOString(),
          note: note || '',
        },
      },
      { headers }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err.response?.data || err.message);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}