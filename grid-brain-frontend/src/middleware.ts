import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role: string;
  exp?: number;
  [key: string]: unknown;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/verify",
  "/auth/callback",
  "/api",
  "/_next",
  "/favicon.ico",
  "/", // Root page handles its own auth check
];

// Routes that require specific roles
const ROLE_PROTECTED_ROUTES = {
  "/admin": ["SUPER_ADMIN", "ADMIN"],
  "/dev": ["DEVELOPER", "TECH_LEAD", "SUPER_ADMIN"],
  "/projects": [
    "CONSULTANT_PO",
    "DEVELOPER",
    "TECH_LEAD",
    "PARTNER_CFO",
    "SUPER_ADMIN",
    "ADMIN",
  ],
  "/blueprint": [
    "CONSULTANT_PO",
    "DEVELOPER",
    "TECH_LEAD",
    "SUPER_ADMIN",
    "ADMIN",
  ],
  "/proposals": ["CONSULTANT_PO", "PARTNER_CFO", "SUPER_ADMIN", "ADMIN"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user is already logged in and tries to access login page, redirect to home
    if (pathname === "/auth/login" && token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        // Check if token is not expired
        if (decodedToken.exp && decodedToken.exp * 1000 > Date.now()) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Invalid token, continue to login page
      }
    }
    return NextResponse.next();
  }

  // For all other routes, require authentication
  if (!token) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const decodedToken = jwtDecode<DecodedToken>(token);

    // Check if token is expired
    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      redirectUrl.searchParams.set("error", "SessionExpired");
      return NextResponse.redirect(redirectUrl);
    }

    // Check role-based access
    for (const [protectedPath, allowedRoles] of Object.entries(
      ROLE_PROTECTED_ROUTES
    )) {
      if (pathname.startsWith(protectedPath)) {
        if (!allowedRoles.includes(decodedToken.role)) {
          // User doesn't have permission for this route
          return NextResponse.redirect(
            new URL("/?error=Unauthorized", request.url)
          );
        }
      }
    }

    // User is authenticated and authorized
    return NextResponse.next();
  } catch (error) {
    // Invalid token
    console.error("Invalid token:", error);
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    redirectUrl.searchParams.set("error", "InvalidToken");
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  // Match all routes except static files and api routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
