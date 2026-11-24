import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/projects"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;
     const hasAccessToken = request.cookies.has("access_token");

     const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
          pathname.startsWith(prefix),
     );
     const isAuthPage = AUTH_PAGES.includes(pathname);

     if (isProtectedRoute && !hasAccessToken) {
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("redirect", pathname);
          return NextResponse.redirect(loginUrl);
     }

     if (isAuthPage && hasAccessToken) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
     }

     return NextResponse.next();
}

export const config = {
     matcher: [
          "/dashboard/:path*",
          "/settings/:path*",
          "/projects/:path*",
          "/login",
          "/register",
     ],
};
