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
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/$/, "");

  // Always allow localhost and 127.0.0.1
  if (cleanOrigin.includes("localhost") || cleanOrigin.includes("127.0.0.1")) {
    return true;
  }

  // Always allow any vercel deployment (*.vercel.app)
  if (cleanOrigin.endsWith(".vercel.app") || cleanOrigin.includes("vercel.app")) {
    return true;
  }

  // If wildcard or explicitly allowed in environment
  if (
    allowedOrigins.includes("*") ||
    allowedOrigins.some((allowed) => allowed.replace(/\/$/, "") === cleanOrigin)
  ) {
    return true;
  }

  // SaaS API default: allow web origins
  return true;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = isOriginAllowed(origin, allowedOrigins);
  const allowOriginHeader = isAllowed ? origin : "*";

  // 1. Global OPTIONS preflight handler for all /api/* routes
  if (request.method === "OPTIONS") {
    const preflightHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": allowOriginHeader,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  // 2. Attach CORS headers to responses for normal API requests
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", allowOriginHeader);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
