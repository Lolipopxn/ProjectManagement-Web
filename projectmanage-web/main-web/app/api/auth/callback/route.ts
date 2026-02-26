import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const config = {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: "/",
  domain: process.env.HOST ?? "localhost",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const frontendUrl = process.env.NEXT_PUBLIC_APP_ORIGIN;

export const dynamic = 'force-dynamic' // defaults to auto
export async function GET(request: Request, params: { params: Promise<{ provider: string }> }) {
  
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('access_token')
  
  if (!token) return NextResponse.redirect(new URL("/", request.url));
  
  const backendUrl = process.env.STRAPI_BASE_URL;
  const path = `/api/auth/google/callback`;

  const url = new URL(backendUrl + path);
  url.searchParams.append('access_token', token)

  const res = await fetch(url.href)
  const data = await res.json()

  ;(await cookies()).set("token", data.jwt, config);

  return NextResponse.redirect(new URL(`/main_pages/overview`, frontendUrl));
}