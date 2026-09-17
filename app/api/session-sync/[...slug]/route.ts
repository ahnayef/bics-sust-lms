import { NextRequest, NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const search = request.nextUrl.search;

  if (!slug || slug.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const action = slug[0];

  // 1. Tag script loader: /api/session-sync/tag/[id]
  if (action === "tag") {
    const id = slug[1];
    if (!id) {
      return new NextResponse("Missing project id", { status: 400 });
    }

    try {
      const res = await fetch(
        `https://www.clarity.ms/tag/${encodeURIComponent(id)}`,
        {
          headers: {
            "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
            Accept: "*/*",
          },
          next: { revalidate: 3600 },
        },
      );

      if (!res.ok) {
        return new NextResponse("Failed to load tag", { status: res.status });
      }

      let scriptText = await res.text();

      // Rewrite Clarity external URLs to our first-party session-sync proxy endpoints
      scriptText = scriptText
        .replace(
          /https:\/\/scripts\.clarity\.ms\//g,
          "/api/session-sync/bundle/",
        )
        .replace(/https:\/\/c\.clarity\.ms\//g, "/api/session-sync/ping/")
        .replace(
          /https:\/\/([a-z0-9-]+)\.clarity\.ms\/collect/g,
          "/api/session-sync/push/$1",
        );

      return new NextResponse(scriptText, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch (err: any) {
      return new NextResponse(err?.message || "Internal error", {
        status: 500,
      });
    }
  }

  // 2. Core Clarity JavaScript bundle: /api/session-sync/bundle/[...path]
  if (action === "bundle") {
    const bundlePath = slug.slice(1).join("/");
    if (!bundlePath) {
      return new NextResponse("Missing bundle path", { status: 400 });
    }

    try {
      const res = await fetch(`https://scripts.clarity.ms/${bundlePath}`, {
        headers: {
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
          Accept: "*/*",
        },
        next: { revalidate: 86400 },
      });

      if (!res.ok) {
        return new NextResponse("Bundle not found", { status: res.status });
      }

      const body = await res.text();
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (err: any) {
      return new NextResponse(err?.message || "Internal error", {
        status: 500,
      });
    }
  }

  // 3. Sync beacon: /api/session-sync/ping/[...path]
  if (action === "ping") {
    const subPath = slug.slice(1).join("/") || "c.gif";
    try {
      const targetUrl = `https://c.clarity.ms/${subPath}${search}`;
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
          Referer: request.headers.get("referer") || "",
          Accept: "image/*,*/*",
        },
      });

      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "image/gif",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new NextResponse(null, { status: 204 });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const search = request.nextUrl.search;

  // 4. Analytics collect data: /api/session-sync/push/[cluster]
  if (slug && slug[0] === "push") {
    const cluster = slug[1] || "o";
    try {
      const targetUrl = `https://${cluster}.clarity.ms/collect${search}`;
      const body = await request.arrayBuffer();

      const headers: Record<string, string> = {
        "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
        "Content-Type":
          request.headers.get("content-type") || "application/json",
      };

      const referer = request.headers.get("referer");
      if (referer) headers["Referer"] = referer;

      const origin = request.headers.get("origin");
      if (origin) headers["Origin"] = origin;

      const forwardedFor =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip");
      if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

      const acceptLang = request.headers.get("accept-language");
      if (acceptLang) headers["Accept-Language"] = acceptLang;

      const contentEncoding = request.headers.get("content-encoding");
      if (contentEncoding) headers["Content-Encoding"] = contentEncoding;

      const cookie = request.headers.get("cookie");
      if (cookie) headers["Cookie"] = cookie;

      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body,
      });

      const resHeaders = new Headers({
        "Access-Control-Allow-Origin": "*",
      });

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) resHeaders.set("Set-Cookie", setCookie);

      const contentType = res.headers.get("content-type");
      if (contentType) resHeaders.set("Content-Type", contentType);

      const resBody = await res.arrayBuffer();
      return new NextResponse(resBody.byteLength > 0 ? resBody : null, {
        status: res.status,
        headers: resHeaders,
      });
    } catch (err: any) {
      return new NextResponse(err?.message || "Collect error", {
        status: 500,
      });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
