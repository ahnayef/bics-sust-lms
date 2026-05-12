import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintQrClient from "./PrintQrClient";

export default async function PrintQrPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claimsData.claims.sub)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    redirect("/dashboard");
  }

  // Fetch books and copies
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, short_id, is_syllabus")
    .order("title");
  const { data: copies } = await supabase
    .from("copies")
    .select("id, book_id, copy_number")
    .order("copy_number");

  return <PrintQrClient books={books ?? []} copies={copies ?? []} />;
}
