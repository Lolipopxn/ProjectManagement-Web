// app/api/voice/token/route.ts
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

const STRAPI_BASE = process.env.STRAPI_BASE_URL;

export async function POST(req: Request) {
  const jwt = (await cookies()).get("token")?.value;
  if (!jwt) return new Response("Unauthorized", { status: 401 });

  const { slug, projectId: inputProjectId } = await req.json().catch(() => ({}));
  let projectId = inputProjectId;

  try {
    // 1) ถ้ายังไม่มี projectId และมี slug → ไปหา id
    if (!projectId && slug) {
      const url = `${STRAPI_BASE}/api/projects?filters[slug][$eq]=${encodeURIComponent(
        slug
      )}&pagination[pageSize]=1`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
      if (!res.ok) return new Response(await res.text(), { status: res.status });
      const data = await res.json();
      projectId = data?.data?.[0]?.id;
    }

    if (!projectId) {
      return new Response("projectId not found (provide slug or projectId)", {
        status: 400,
      });
    }

    // 2) ขอ Voice token จาก Strapi (controller ของคุณที่ตรวจสมาชิกแล้ว)
    const voiceRes = await fetch(`${STRAPI_BASE}/api/voice/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ projectId }),
      cache: "no-store",
    });

    const body = await voiceRes.text();
    return new Response(body, {
      status: voiceRes.status,
      headers: { "content-type": voiceRes.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return new Response(err?.message || "Proxy error", { status: 500 });
  }
}
