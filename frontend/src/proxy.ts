import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "stockflow_token";
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/customers",
  "/products",
  "/services",
  "/stock",
  "/quotes",
  "/settings",
];

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  if (PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/services/:path*",
    "/stock/:path*",
    "/quotes/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
