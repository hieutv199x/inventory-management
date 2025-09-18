import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require auth
const PUBLIC_PATHS: RegExp[] = [
  /^\/$/,                    // home (adjust if home should be protected)
  /^\/signin/,
  /^\/auth\/.*/i,
  /^\/api\/auth\/.*/i,
  /^\/api\/jobs\/.*/i,
  /^\/_next\/.*/i,
  /^\/favicon\.ico$/i,
  /^\/images\/.*/i,
  /^\/public\/.*/i,
  /^\/api\/tiktok\/webhook(?:\/.*)?$/i, // make TikTok webhook public
];

// Utility: check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((pattern) => pattern.test(pathname));
}

// Utility: detect API routes for response formatting
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

// Extract token from Authorization header or cookies
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring("Bearer ".length);
  }
  // Fall back to common cookie names used in the codebase
  return (
    req.cookies.get("session_id")?.value ||
    req.cookies.get("session_token")?.value ||
    null
  );
}

// Lightweight expiry check without verifying signature
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false; // Not a JWT; ignore here
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    // If parsing fails, don't treat as expired here; let route-level auth handle invalid tokens
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = extractToken(req);

  // If no token, let route-level guards handle authorization (or customize to block here)
  if (!token) {
    return NextResponse.next();
  }

  // If token expired: clear cookies and block
  if (isJwtExpired(token)) {
    if (isApiRoute(pathname)) {
      const res = NextResponse.json({ error: "Token expired" }, { status: 401 });
      // Clear cookies
      res.cookies.set("session_id", "", { path: "/", maxAge: 0 });
      res.cookies.set("session_token", "", { path: "/", maxAge: 0 });
      res.headers.set("x-auth-token-expired", "1");
      return res;
    } else {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("reason", "expired");
      const res = NextResponse.redirect(url);
      res.cookies.set("session_id", "", { path: "/", maxAge: 0 });
      res.cookies.set("session_token", "", { path: "/", maxAge: 0 });
      res.headers.set("x-auth-token-expired", "1");
      return res;
    }
  }

  return NextResponse.next();
}

// Apply to all paths except static assets by default
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
