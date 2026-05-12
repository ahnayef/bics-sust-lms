import { Suspense } from "react";
import { getThanas } from "@/server/geo";
import SetupForm from "./SetupForm";

async function SetupWithData() {
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
