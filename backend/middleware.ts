import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5176",
  "http://localhost:5177",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.includes(origin);

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
    } else if (allowedOrigins.length > 0) {
      preflightHeaders["Access-Control-Allow-Origin"] = allowedOrigins[0];
    }

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
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
