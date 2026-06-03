import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "stockflow_token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
