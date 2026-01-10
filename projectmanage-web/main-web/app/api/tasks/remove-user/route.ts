import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { taskId, userId } = await req.json();

    const token = ( await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await axios.put(
      `${process.env.STRAPI_BASE_URL}/api/tasks/${taskId}`,
      {
        data: {
          assigned_to_user_ids: {
            disconnect: [{ id: userId }],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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