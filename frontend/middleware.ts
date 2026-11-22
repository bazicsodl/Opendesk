import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const token = req.cookies.get("token")?.value || null;
  const protectedPrefixes = [
    "/recruiter",
    "/messages",
    "/notifications",
    "/profile",
    "/posts",
    "/connections",
    "/jobs",
    "/settings",
    "/upload",
  ];

  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (isProtected && !token) {
    const redirectTo = path.startsWith("/recruiter") ? "/recruiter/login" : "/auth/login";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/recruiter/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/posts/:path*",
    "/connections/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/upload/:path*",
  ],
};
