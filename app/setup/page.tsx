import { Suspense } from "react";
import { getThanas, getProfile } from "@/server/geo";
import SetupForm from "./SetupForm";
import { redirect } from "next/navigation";
import { getClaims } from "@/server/user";

async function SetupWithData() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const profile = await getProfile(claims.sub as string);
  if (profile?.profile_completed) {
    redirect("/dashboard");
  }

  const { data: thanas, source } = await getThanas();
  return <SetupForm thanas={thanas} geoSource={source} />;
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e5d9c4] text-[#5a4b3f] ink-text text-sm">
          Loading…
        </div>
      }
    >
      <SetupWithData />
    </Suspense>
  );
}
