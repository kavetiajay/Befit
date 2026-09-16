import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Default localhost origins for local development
const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
];

function getAllowedOrigins(): string[] {
  const origins = new Set<string>(defaultLocalOrigins);

  // Parse CORS_ALLOWED_ORIGINS (comma-separated list)
  const envCors = process.env.CORS_ALLOWED_ORIGINS;
  if (envCors) {
    envCors
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  // Parse FRONTEND_URL if provided
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    const cleanFrontendUrl = frontendUrl.trim().replace(/\/$/, "");
    if (cleanFrontendUrl) {
      origins.add(cleanFrontendUrl);
    }
  }

  return Array.from(origins);
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  const cleanOrigin = origin.trim().replace(/\/$/, "");
  return allowedOrigins.some((allowed) => allowed.replace(/\/$/, "") === cleanOrigin);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = isOriginAllowed(origin, allowedOrigins);

  // 1. Global OPTIONS preflight handler for all /api/* routes
  if (request.method === "OPTIONS") {
    const preflightHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
      "Access-Control-Max-Age": "86400",
    };

    if (isAllowed) {
      preflightHeaders["Access-Control-Allow-Origin"] = origin;
      preflightHeaders["Vary"] = "Origin";
    }

    return new NextResponse(null, {
      status: isAllowed ? 204 : 403,
      headers: isAllowed ? preflightHeaders : undefined,
    });
  }

  // 2. Attach CORS headers to responses for normal API requests
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
