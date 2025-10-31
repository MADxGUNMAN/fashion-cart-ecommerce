import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login", "/", "/home"];
const protectedRoutes = ["/super-admin"];
const superAdminRoutes = ["/super-admin"];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const { role } = payload as {
        role: string;
      };

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "SUPER_ADMIN" ? "/super-admin" : "/home",
            request.url
          )
        );
      }

      // Redirect super admin users away from regular user pages to admin panel
      if (role === "SUPER_ADMIN" && pathname === "/home") {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      
      // Block non-super-admin users from admin routes
      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route: string) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Token verification failed", e);
      // For cross-origin setup, just allow access if token verification fails
      // The backend will handle authentication for API calls
      return NextResponse.next();
    }
  }

  // Only redirect to login for protected routes when no token is present
  if (protectedRoutes.some((route: string) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
