"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/server/geo";

export async function signInWithGoogle() {
  const headersList = await headers();

  const forwardedProto = headersList.get("x-forwarded-proto");
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = headersList.get("host");

  const protocol = forwardedProto ?? "https";
  const hostname = forwardedHost ?? host ?? "localhost:3000";
  const origin = `${protocol}://${hostname}`;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=oauth");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithEmail(
  formData: FormData,
): Promise<{ error: string } | void> {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const profile = await getProfile(data.user.id);

  if (!profile || profile.profile_completed === false) {
    redirect("/setup");
  }

  redirect("/dashboard");
}
