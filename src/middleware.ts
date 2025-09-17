/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req: { auth: any; nextUrl: { pathname: string }; url: string | URL | undefined }) => {
  const isAuth = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isPublicPage = req.nextUrl.pathname.startsWith("/public");

  // ✅ Redirect authenticated users away from auth pages to "/"
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Redirect unauthenticated users to sign in page
  if (!isAuth && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
