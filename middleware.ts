import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, checkVapiRateLimit } from "@/lib/ratelimit";

export async function middleware(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Endpoint VAPI: limite più alto, identificatore diverso
  if (req.nextUrl.pathname.startsWith("/api/vapi/")) {
    const allowed = await checkVapiRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
    }
    return NextResponse.next();
  }

  // Tutti gli altri endpoint API
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
