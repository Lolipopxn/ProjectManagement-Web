import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";

//helper to update boards in project
async function getToken() {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value;
}

//update boards in project
async function updateBoards (documentId: string, boards: string[], token: string) {
    return await axios.put(`${process.env.STRAPI_BASE_URL}/api/projects/${documentId}`,
        {
            data: { boards }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
     );
} 

//Update current board in project
async function updateCurrentBoard (documentId: string, currentBoard: string, token: string) {
    return await axios.put(`${process.env.STRAPI_BASE_URL}/api/projects/${documentId}`,
        {
            data: { currentBoard }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

//route 
export async function PUT(res: Request) {
    try {
        const { documentId, boards, currentBoard } = await res.json();
        const token = await getToken();

        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized"}, { status :401})
        }

        const request: Promise<any>[] = [];

        if (boards) {
            request.push(updateBoards(documentId, boards, token));
        }

        if (currentBoard) {
            request.push(updateCurrentBoard(documentId, currentBoard, token));
        }

        await Promise.all(request);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}