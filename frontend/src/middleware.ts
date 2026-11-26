import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;
     const hasAccessToken = request.cookies.has("access_token");
     const isAuthPage = AUTH_PAGES.includes(pathname);

     if (isAuthPage && hasAccessToken) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
     }

     return NextResponse.next();
}

export const config = {
     matcher: ["/login", "/register"],
};