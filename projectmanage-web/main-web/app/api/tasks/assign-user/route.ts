import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from "next/headers";

async function getToken() {
        const cookieStore = await cookies();
        return cookieStore.get("token")?.value;
    }

export async function POST(req: Request) {
  try {
    const { taskId, projectId, userId } = await req.json();
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const memberRes = await axios.get(
        `${process.env.STRAPI_BASE_URL}/api/project-members`,
        {
            params: {
            filters: {
                project: { id: projectId },
                user: { id: userId },
            },
            },
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
    );


    if (!memberRes.data.data.length) {
      return NextResponse.json(
        { success: false, message: 'User not in project' },
        { status: 403 }
      );
    }

   const taskRes = await axios.get(
    `${process.env.STRAPI_BASE_URL}/api/tasks/${taskId}`,
    {
        params: {
            populate: ['assigned_to_user_ids'],
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    );

    const assignedUsers =
    taskRes.data.data.attributes?.assigned_to_user_ids?.data ?? [];

    const currentUsers = assignedUsers.map(
    (u: any) => u.id
    );

    if (currentUsers.includes(userId)) {
        return NextResponse.json({ success: true });
    }

    await axios.put(`${process.env.STRAPI_BASE_URL}/api/tasks/${taskId}`, 
        {
            data: {
                assigned_to_user_ids: {
                    connect: [{ id: userId }],
                },
            },
        }, 
        {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}