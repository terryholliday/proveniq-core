import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/error",
  "/api/auth",
  "/bible",
];

const API_PATHS = ["/api/v1"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isApiPath(pathname: string): boolean {
  return API_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests for API routes
  if (isApiPath(pathname) && request.method === "OPTIONS") {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3001").split(",");
    const origin = request.headers.get("origin") || "";
    
    const response = new NextResponse(null, { status: 204 });
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
    
    return response;
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add CORS headers for API routes
  if (isApiPath(pathname)) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3001").split(",");
    const origin = request.headers.get("origin") || "";
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Skip auth check for public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // API routes use API key auth (handled in route handlers)
  if (isApiPath(pathname)) {
    return response;
  }

  // Check for session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to signin if no token
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
