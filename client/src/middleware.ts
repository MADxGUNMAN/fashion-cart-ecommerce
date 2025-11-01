import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/auth/register", "/auth/login", "/", "/home", "/listing", "/cart", "/terms", "/account", "/checkout"];
const superAdminRoutes = ["/super-admin"];
const userRoutes = ["/", "/home", "/listing", "/cart", "/checkout", "/account", "/terms"];

export async function middleware(request: NextRequest) {
  // Try to get token from cookies first, then from Authorization header
  let accessToken = request.cookies.get("accessToken")?.value;
  
  // If no cookie token, try Authorization header
  if (!accessToken) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
    }
  }
  
  const { pathname } = request.nextUrl;

  // Allow all super-admin routes without token check (client-side protection handles this)
  if (pathname.startsWith("/super-admin")) {
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

      if (
        role === "SUPER_ADMIN" &&
        userRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      if (
        role !== "SUPER_ADMIN" &&
        superAdminRoutes.some((route) => pathname.startsWith(route))
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Token verification failed", e);
      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (refreshResponse.ok) {
        const response = NextResponse.next();
        response.cookies.set(
          "accessToken",
          refreshResponse.headers.get("Set-Cookie") || ""
        );
        return response;
      } else {
        //ur refresh is also failed
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
  }

  // Check if route requires authentication
  // Allow product detail pages (/listing/[id]) without authentication
  const isProductDetailPage = pathname.startsWith("/listing/") && pathname !== "/listing";
  
  if (!publicRoutes.includes(pathname) && !isProductDetailPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
