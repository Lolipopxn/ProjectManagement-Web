import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    // Fetch user data from Strapi
    const strapiUrl = process.env.STRAPI_BASE_URL || "http://localhost:1337";
    const cookieStore = await cookies();
    const strapiToken = cookieStore.get('token')?.value;

    if (!strapiToken) {
      console.error("STRAPI_API_TOKEN not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Try to find user by ID first (assuming UID might be user ID)
    let user = null;
    
    try {
      const userResponse = await fetch(`${strapiUrl}/api/users/${uid}?populate=*`, {
        headers: {
          "Authorization": `Bearer ${strapiToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (userResponse.ok) {
        user = await userResponse.json();
      }
    } catch (error) {
      console.log("User not found by ID, trying other methods");
    }

    // If not found by ID, try searching by username or other fields
    if (!user) {
      try {
        const searchResponse = await fetch(`${strapiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(uid)}&populate=*`, {
          headers: {
            "Authorization": `Bearer ${strapiToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult && searchResult.length > 0) {
            user = searchResult[0];
          }
        }
      } catch (error) {
        console.log("User not found by username either");
      }
    }

    // If still not found, try searching in a custom collection (if you have one for voice users)
    if (!user) {
      try {
        const voiceUserResponse = await fetch(`${strapiUrl}/api/voice-users?filters[agoraUid][$eq]=${encodeURIComponent(uid)}&populate=user`, {
          headers: {
            "Authorization": `Bearer ${strapiToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (voiceUserResponse.ok) {
          const voiceUserResult = await voiceUserResponse.json();
          if (voiceUserResult?.data && voiceUserResult.data.length > 0) {
            user = voiceUserResult.data[0].attributes.user?.data?.attributes || voiceUserResult.data[0].attributes;
          }
        }
      } catch (error) {
        console.log("Voice user mapping not found");
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract user data (handle both direct user object and Strapi response format)
    const userData = user.attributes || user;
    
    return NextResponse.json({
      username: userData.username || userData.name || userData.displayName || userData.fullName,
      name: userData.name || userData.fullName || userData.displayName || userData.username,
      displayName: userData.displayName || userData.username || userData.name || userData.fullName,
      email: userData.email,
    });

  } catch (error) {
    console.error("Error fetching user by UID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
