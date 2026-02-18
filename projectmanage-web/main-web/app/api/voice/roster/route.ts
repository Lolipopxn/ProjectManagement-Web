import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Fetch roster data from Strapi
    const strapiUrl = process.env.STRAPI_BASE_URL;
    const cookieStore = await cookies();
    const strapiToken = cookieStore.get('token')?.value;

    if (!strapiToken) {
      console.error("STRAPI_API_TOKEN not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // First, try to find the project/room by slug
    let projectId = null;
    try {
      const projectResponse = await fetch(`${strapiUrl}/api/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`, {
        headers: {
          "Authorization": `Bearer ${strapiToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        if (projectData?.data && projectData.data.length > 0) {
          projectId = projectData.data[0].id;
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }

    // If no project found, return empty roster
    if (!projectId) {
      return NextResponse.json({ users: [] });
    }

    // Fetch active voice sessions for this project/room
    try {
      const voiceSessionsResponse = await fetch(`${strapiUrl}/api/voice-sessions?filters[project][id][$eq]=${projectId}&filters[active][$eq]=true&populate[user][populate]=*`, {
        headers: {
          "Authorization": `Bearer ${strapiToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (voiceSessionsResponse.ok) {
        const sessionsData = await voiceSessionsResponse.json();
        
        const users = (sessionsData?.data || []).map((session: any) => {
          try {
            const sessionAttrs = session.attributes || session;
            
            // Handle different possible user data structures
            let user = null;
            if (sessionAttrs.user?.data?.attributes) {
              user = sessionAttrs.user.data.attributes;
            } else if (sessionAttrs.user?.attributes) {
              user = sessionAttrs.user.attributes;
            } else if (sessionAttrs.user && typeof sessionAttrs.user === 'object') {
              user = sessionAttrs.user;
            }
            
            const uid = sessionAttrs.agoraUid || sessionAttrs.uid || session.id;
            const username = user?.username || user?.name || user?.displayName || user?.fullName || `User ${uid}`;
            
            return {
              uid: String(uid),
              username,
              muted: sessionAttrs.muted || false,
              joinedAt: sessionAttrs.joinedAt || sessionAttrs.createdAt,
            };
          } catch (sessionError) {
            console.error("Error processing session:", sessionError, session);
            // Return a fallback user object
            return {
              uid: String(session.id || 'unknown'),
              username: `User ${session.id || 'unknown'}`,
              muted: false,
              joinedAt: new Date().toISOString(),
            };
          }
        }).filter(Boolean); // Remove any null/undefined entries

        return NextResponse.json({ users });
      } else {
        console.error("Voice sessions response not ok:", voiceSessionsResponse.status, await voiceSessionsResponse.text());
      }
    } catch (error) {
      console.error("Error fetching voice sessions:", error);
    }

    // Fallback: Try to fetch from a simpler endpoint or return mock data for testing
    try {
      // If voice-sessions doesn't exist, try to get project members as a fallback
      const membersResponse = await fetch(`${strapiUrl}/api/projects/${projectId}?populate[members][populate]=*`, {
        headers: {
          "Authorization": `Bearer ${strapiToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (membersResponse.ok) {
        const projectData = await membersResponse.json();
        const members = projectData?.data?.attributes?.members?.data || [];
        
        // Return project members as potential voice users (for testing)
        const users = members.slice(0, 3).map((member: any, index: number) => {
          const memberAttrs = member.attributes || member;
          return {
            uid: String(member.id || index + 1),
            username: memberAttrs.username || memberAttrs.name || memberAttrs.displayName || `Member ${index + 1}`,
            muted: Math.random() > 0.5, // Random mute status for demo
            joinedAt: new Date().toISOString(),
          };
        });

        return NextResponse.json({ users });
      }
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
    }

    // Final fallback: return empty roster
    return NextResponse.json({ users: [] });

  } catch (error) {
    console.error("Error fetching voice roster:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
