import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token found" },
        { status: 401 }
      );
    }

    console.log("Marking all notifications as read...");

    const response = await fetch(
      `${STRAPI_URL}/api/notifications/mark-all-read`,
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
        { error: "Failed to mark all notifications as read", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("All notifications marked as read successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in mark-all-read API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
