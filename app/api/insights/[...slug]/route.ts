import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const search = request.nextUrl.search;

  if (!slug || slug.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 1. Tag script loader: /api/insights/tag/[id]
  if (slug[0] === "tag") {
    const id = slug[1];
    if (!id) {
      return new NextResponse("Missing project id", { status: 400 });
    }

    try {
      const res = await fetch(`https://www.clarity.ms/tag/${id}`, {
        headers: {
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
          Accept: "*/*",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return new NextResponse("Failed to load tag", { status: res.status });
      }

      let scriptText = await res.text();

      // Rewrite Clarity external domains to our local first-party proxy endpoints
      scriptText = scriptText
        .replace(/https:\/\/scripts\.clarity\.ms\//g, "/api/insights/scripts/")
        .replace(/https:\/\/c\.clarity\.ms\//g, "/api/insights/c/")
        .replace(
          /https:\/\/[a-z0-9-]+\.clarity\.ms\/collect/g,
          "/api/insights/collect",
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

  // 2. Core Clarity JavaScript: /api/insights/scripts/[...path]
  if (slug[0] === "scripts") {
    const scriptPath = slug.slice(1).join("/");
    try {
      const res = await fetch(`https://scripts.clarity.ms/${scriptPath}`, {
        headers: {
          "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
          Accept: "*/*",
        },
        next: { revalidate: 86400 },
      });

      if (!res.ok) {
        return new NextResponse("Script not found", { status: res.status });
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

  // 3. Sync beacon: /api/insights/c/[...path] or /api/insights/c.gif
  if (slug[0] === "c" || slug[0] === "c.gif") {
    const subPath = slug[0] === "c" ? slug.slice(1).join("/") : "c.gif";
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
    } catch (err: any) {
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

  // 4. Analytics collect data: /api/insights/collect
  if (slug && slug[0] === "collect") {
    try {
      const targetUrl = `https://u.clarity.ms/collect${search}`;
      const body = await request.arrayBuffer();

      const headers: Record<string, string> = {
        "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
        "Content-Type":
          request.headers.get("content-type") || "application/json",
      };

      const referer = request.headers.get("referer");
      if (referer) headers["Referer"] = referer;

      const forwardedFor = request.headers.get("x-forwarded-for");
      if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body,
      });

      const resData = await res.arrayBuffer();
      return new NextResponse(resData, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "text/plain",
          "Cache-Control": "no-store",
        },
      });
    } catch (err: any) {
      return new NextResponse(null, { status: 204 });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
