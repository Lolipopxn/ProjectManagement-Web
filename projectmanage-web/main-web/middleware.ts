import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/auth_page/login";
  const isProtectedPage = pathname.startsWith("/main_pages");

  // ถ้า login แล้ว
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/main_pages/overview", request.url));
  }

  // ถ้าไม่มี token
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/auth_page/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth_page/login", "/main_pages/:path*"],
};