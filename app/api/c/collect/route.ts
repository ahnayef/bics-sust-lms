import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();

    const headers: Record<string, string> = {};

    const contentType = request.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;

    const ua = request.headers.get("user-agent");
    if (ua) headers["User-Agent"] = ua;

    const accept = request.headers.get("accept");
    if (accept) headers["Accept"] = accept;

    const forwarded =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip");
    if (forwarded) headers["X-Forwarded-For"] = forwarded;

    const res = await fetch("https://g.clarity.ms/collect", {
      method: "POST",
      headers,
      body,
    });

    const resBody = await res.arrayBuffer();

    const resHeaders = new Headers({ ...CORS_HEADERS });
    const resContentType = res.headers.get("content-type");
    if (resContentType) resHeaders.set("Content-Type", resContentType);

    return new NextResponse(resBody.byteLength > 0 ? resBody : null, {
      status: res.status,
      headers: resHeaders,
    });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

export async function GET() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
