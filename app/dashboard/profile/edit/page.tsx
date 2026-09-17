import PageTransition from "@/components/PageTransition";
import { getProfile, getRanks, getThanas } from "@/server/geo";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, thanaResult, rankResult] = await Promise.all([
    getProfile(claims.sub),
    getThanas(),
    getRanks(),
  ]);
  if (!profile) redirect("/login");

  return (
    <PageTransition>
      <EditProfileForm
        profile={profile}
        thanas={thanaResult.data}
        ranks={rankResult.data}
        geoSource={thanaResult.source}
      />
    </PageTransition>
  );
}
