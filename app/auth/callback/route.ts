import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const userId = data.session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", userId)
    .single();

  const destination = !profile || !profile.profile_completed ? "/setup" : next;

  // If the user has a completed profile and logged in via OAuth, refresh avatar
  if (profile?.profile_completed) {
    const avatarUrl = data.session.user.user_metadata?.avatar_url ?? null;
    if (avatarUrl) {
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
