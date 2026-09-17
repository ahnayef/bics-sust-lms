import PageTransition from "@/components/PageTransition";
import { getProfile, getRanks, getThanas } from "@/server/geo";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SetupForm from "./SetupForm";

async function SetupWithData() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const profile = await getProfile(claims.sub as string);
  if (profile?.profile_completed) {
    redirect("/dashboard");
  }

  const { data: thanas, source } = await getThanas();
  const { data: ranks } = await getRanks();
  return (
    <PageTransition>
      <SetupForm thanas={thanas} ranks={ranks} geoSource={source} />
    </PageTransition>
  );
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
