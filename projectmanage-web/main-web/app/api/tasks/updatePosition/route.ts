import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import axios from "axios";



export async function PUT(req: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { documentId, board_name, pos_x, pos_y, is_left } = body;

    const res = await axios.put(`${process.env.STRAPI_BASE_URL}/api/tasks/${documentId}`, {
      data: {
        board_name,
        pos_x,
        pos_y,
        is_left
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