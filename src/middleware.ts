import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PREFIXES = ["/analytics", "/links", "/domains", "/cai-dat"];
const API_PREFIXES_REQUIRE_AUTH = ["/api/links", "/api/domains", "/api/settings"];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApiPath(pathname: string): boolean {
  return API_PREFIXES_REQUIRE_AUTH.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const userEmail = request.cookies.get("ts_user_email")?.value ?? "";
  const userRole = request.cookies.get("ts_user_role")?.value ?? "MEMBER";

  if (isDashboardPath(pathname) && !userEmail) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedApiPath(pathname) && !userEmail) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  if (userEmail) {
    requestHeaders.set("x-user-email", userEmail);
    requestHeaders.set("x-user-role", userRole);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/links/:path*",
    "/domains/:path*",
    "/cai-dat/:path*",
    "/api/links/:path*",
    "/api/domains/:path*",
    "/api/settings/:path*",
  ],
};
