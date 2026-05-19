import { createClient } from "@/lib/supabase/server";

export async function logActionError(
  action: string,
  errorMessage: string,
  actorId?: string | null,
) {
  try {
    const supabase = await createClient();
    await supabase.from("action_logs").insert({
      action_type: "error",
      target_id: "00000000-0000-0000-0000-000000000000",
      actor_id: actorId ?? null,
      details: JSON.stringify({ action, error: errorMessage }),
    });
  } catch {
    // Don't let logging failures break the main flow
  }
}
