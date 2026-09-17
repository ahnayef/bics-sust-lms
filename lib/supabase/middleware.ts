import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Fast local JWT decode from cookie without blocking on remote HTTPS calls
  let user: { sub?: string } | null = null;
  try {
    const allCookies = request.cookies.getAll();
    const authCookies = allCookies
      .filter((c) => c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name));

    let rawTokenString = "";
    if (authCookies.length === 1) {
      rawTokenString = authCookies[0].value;
    } else if (authCookies.length > 1) {
      rawTokenString = authCookies.map((c) => c.value).join("");
    }

    if (rawTokenString) {
      let accessToken = "";
      try {
        const parsed = JSON.parse(rawTokenString);
        accessToken = parsed.access_token || parsed[0] || "";
      } catch {
        if (rawTokenString.startsWith("base64-")) {
          const decoded = Buffer.from(
            rawTokenString.slice(7),
            "base64",
          ).toString("utf-8");
          const parsed = JSON.parse(decoded);
          accessToken = parsed.access_token || "";
        }
      }

      if (accessToken && accessToken.includes(".")) {
        const payloadBase64 = accessToken.split(".")[1];
        const payloadStr = Buffer.from(payloadBase64, "base64").toString(
          "utf-8",
        );
        const payload = JSON.parse(payloadStr);
        if (
          payload &&
          payload.sub &&
          (!payload.exp || payload.exp * 1000 > Date.now())
        ) {
          user = { sub: payload.sub };
        }
      }
    }
  } catch {
    // If local decode fails, fallback below
  }

  // Fast fallback to getSession if local parsing wasn't matched
  if (!user) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.id) {
        user = { sub: data.session.user.id };
      }
    } catch {
      // Ignore
    }
  }

  const path = request.nextUrl.pathname;

  // If user is already logged in, /login should redirect to /dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Routes that require a logged-in session.
  // /auth/* must stay open — the callback route establishes the session.
  const requiresAuth =
    (path.startsWith("/dashboard") || path.startsWith("/setup")) &&
    !path.startsWith("/auth");

  if (!user && requiresAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // /setup is only for users who haven't completed their profile yet.
  // If they're already set up, send them to the dashboard.
  if (user && path.startsWith("/setup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed")
      .eq("id", user.sub)
      .single();

    if (profile?.profile_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
