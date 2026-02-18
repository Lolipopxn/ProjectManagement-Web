import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_BASE_URL || "http://localhost:1337";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token found" },
        { status: 401 }
      );
    }

    const { id } = await params;

    console.log(`Marking notification ${id} as read...`);

    const response = await fetch(
      `${STRAPI_URL}/api/notifications/${id}/mark-read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Strapi error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to mark notification as read", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Notification marked as read successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in mark-read API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
