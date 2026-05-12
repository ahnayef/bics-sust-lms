import { getClaims } from "@/server/user";
import { getProfile, getThanas } from "@/server/geo";
import { redirect } from "next/navigation";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, thanaResult] = await Promise.all([
    getProfile(claims.sub),
    getThanas(),
  ]);
  if (!profile) redirect("/login");

  return (
    <EditProfileForm
      profile={profile}
      thanas={thanaResult.data}
      geoSource={thanaResult.source}
    />
  );
}
