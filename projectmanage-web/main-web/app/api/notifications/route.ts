import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token found" },
        { status: 401 }
      );
    }

    console.log("Fetching notifications from Strapi...");

    const response = await fetch(
      `${STRAPI_URL}/api/notifications?populate=*&sort=createdAt:desc&pagination[limit]=50`,
      {
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
        { error: "Failed to fetch notifications", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Notifications fetched successfully:", data.data?.length || 0);

    // Strapi 5 returns { data: [...] }
    return NextResponse.json({
      notifications: data.data || [],
    });
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
