import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_BASE_URL;

/** ---- helpers ---- */
async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new Error("Missing Strapi token cookie 'token'");
  return token;
}

async function strapiFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  return res;
}

async function getProjectIdBySlug(slug: string, token: string) {
  const r = await strapiFetch(
    `/api/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=slug`,
    token
  );
  if (!r.ok) return null;
  const js = await r.json();
  return js?.data?.[0]?.id ?? null;
}

async function getMeId(token: string) {
  const r = await strapiFetch(`/api/users/me?populate=*`, token);
  if (!r.ok) return null;
  const me = await r.json();
  return me?.id ?? null;
}

async function findActiveSession(projectId: number, agoraUid: string, token: string) {
  const r = await strapiFetch(
    `/api/voice-sessions?filters[project][id][$eq]=${projectId}&filters[agoraUid][$eq]=${encodeURIComponent(
      agoraUid
    )}&filters[active][$eq]=true`,
    token
  );
  if (!r.ok) return null;
  const js = await r.json();
  return js?.data?.[0] ?? null; // return first active session
}

// Find latest session regardless of active flag
async function findLatestSessionAny(projectId: number, agoraUid: string, token: string) {
  const r = await strapiFetch(
    `/api/voice-sessions?filters[project][id][$eq]=${projectId}` +
      `&filters[agoraUid][$eq]=${encodeURIComponent(agoraUid)}` +
      `&sort[0]=createdAt:desc&pagination[pageSize]=1`,
    token
  );
  if (!r.ok) return null;
  const js = await r.json();
  return js?.data?.[0] ?? null;
}

/** ---- POST /api/voice/session  (join) ----
 * body: { slug: string, agoraUid: string, muted?: boolean }
 * สร้างหรือ reactivate session (active=true)
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken();
    const body = await req.json();
    const { slug, agoraUid, muted = false, deaf = false } = body || {};

    if (!slug || !agoraUid) {
      return NextResponse.json({ error: "slug and agoraUid required" }, { status: 400 });
    }

    const projectId = await getProjectIdBySlug(slug, token);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userId = await getMeId(token); // optional, but nice to store
    const existing = await findActiveSession(projectId, String(agoraUid), token);
    const nowIso = new Date().toISOString();

    if (existing) {
      // Already active → update muted / joinedAt (optional)
      const docId = existing?.documentId;
      if (!docId) {
        return NextResponse.json({ error: "Missing documentId on session" }, { status: 500 });
      }
      const r = await strapiFetch(`/api/voice-sessions/${docId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          data: { muted: !!muted, deaf: !!deaf, joinedAt: existing?.attributes?.joinedAt ?? nowIso, active: true },
        }),
      });
      const js = await r.json();
      return NextResponse.json({ ok: true, data: js?.data });
    }

    // Create new session
    const payload: any = {
      data: {
        project: projectId,
        agoraUid: String(agoraUid),
        muted: !!muted,
        deaf: !!deaf,
        active: true,
        joinedAt: nowIso,
      },
    };
    if (userId) payload.data.user = userId;

    const r = await strapiFetch(`/api/voice-sessions`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `Strapi create failed: ${t}` }, { status: 500 });
    }
    const js = await r.json();
    return NextResponse.json({ ok: true, data: js?.data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Join failed" }, { status: 500 });
  }
}

/** ---- DELETE /api/voice/session  (leave) ----
 * body: { slug: string, agoraUid: string, hard?: boolean }
 * จะปิด active session หรือ hard delete ตาม flag
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = await getAuthToken();
    const url = new URL(req.url);
    const documentIdFromQuery = url.searchParams.get("documentId");
    const hardFromQuery = url.searchParams.get("hard");
    const hardQuery = hardFromQuery === "1" || hardFromQuery === "true";

    // Add: accept slug/agoraUid via query for keepalive unload calls
    const slugFromQuery = url.searchParams.get("slug");
    const agoraUidFromQuery = url.searchParams.get("agoraUid");

    // --- เดิม: ลบด้วย slug + agoraUid ---
    const body = await req.json().catch(() => ({}));
    const { slug, agoraUid, hard = false } = body || {};

    // Use query values as fallback when body is missing (e.g., keepalive)
    const effSlug = slug || slugFromQuery;
    const effAgora = agoraUid || agoraUidFromQuery;
    const effHard = hardQuery || !!hard;

    if (!effSlug || !effAgora) {
      return NextResponse.json({ error: "slug and agoraUid required (or provide ?documentId=...)" }, { status: 400 });
    }

    const projectId = await getProjectIdBySlug(effSlug, token);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = effHard
      ? await findLatestSessionAny(projectId, String(effAgora), token)
      : await findActiveSession(projectId, String(effAgora), token);

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const docId = existing?.documentId;
    if (!docId) {
      return NextResponse.json({ error: "Missing documentId on session" }, { status: 500 });
    }

    if (effHard) {
      const r = await strapiFetch(`/api/voice-sessions/${docId}`, token, { method: "DELETE" });
      if (!r.ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      return NextResponse.json({ ok: true, deleted: docId });
    } else {
      const r = await strapiFetch(`/api/voice-sessions/${docId}`, token, {
        method: "PUT",
        body: JSON.stringify({ data: { active: false, leftAt: new Date().toISOString() } }),
      });
      if (!r.ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
      const js = await r.json();
      return NextResponse.json({ ok: true, data: js?.data });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Leave failed" }, { status: 500 });
  }
}

/** ---- PATCH /api/voice/session  (mute toggle) ----
 * body: { slug: string, agoraUid: string, muted: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = await getAuthToken();
    const body = await req.json();
    const { slug, agoraUid, muted, deaf } = body || {};
    if (!slug || !agoraUid) {
      return NextResponse.json({ error: "slug, agoraUid, muted, deaf required" }, { status: 400 });
    }

    const projectId = await getProjectIdBySlug(slug, token);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await findActiveSession(projectId, String(agoraUid), token);
    if (!existing) {
      // no active session → ignore silently
      return NextResponse.json({ ok: true, data: null });
    }

    const docId = existing?.documentId;
    if (!docId) {
      return NextResponse.json({ error: "Missing documentId on session" }, { status: 500 });
    }

    const updateData: any = {}

    if (typeof muted === "boolean") updateData.muted = muted
    if (typeof deaf === "boolean") updateData.deaf = deaf

   const r = await strapiFetch(`/api/voice-sessions/${docId}`, token, {
      method: "PUT",
      body: JSON.stringify({
        data: updateData
      }),
    });
    
    if (!r.ok) return NextResponse.json({ error: "Mute update failed" }, { status: 500 });
    const js = await r.json();
    return NextResponse.json({ ok: true, data: js?.data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Patch failed" }, { status: 500 });
  }
}