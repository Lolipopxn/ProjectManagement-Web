import { NextResponse } from "next/server";
import axios from "axios";
import { cookies, headers } from 'next/headers';

export async function PUT(req: any) {
  try {
    const body = await req.json();

    const token = ( await cookies()).get('token')?.value;
        if (!token) {
          return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        }
    const { documentId, task_status } = body;

    const res = await axios.put(`${process.env.STRAPI_BASE_URL}/api/tasks/${documentId}`, {
      data: {
        task_status
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}