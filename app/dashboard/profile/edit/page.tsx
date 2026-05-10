import { getClaims } from "@/server/user";
import { getProfile, getDivisions } from "@/server/geo";
import {
  fetchDistrictsByDivision,
  fetchUpazilasByDistrict,
} from "@/server/profiles";
import { redirect } from "next/navigation";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, divResult] = await Promise.all([
    getProfile(claims.sub),
    getDivisions(),
  ]);
  if (!profile) redirect("/login");

  // Pre-fetch districts & upazilas for the user's current location
  const [districtResult, upazilaResult] = await Promise.all([
    profile.division_id
      ? fetchDistrictsByDivision(profile.division_id)
      : Promise.resolve({ data: [], source: "supabase" as const }),
    profile.district_id
      ? fetchUpazilasByDistrict(profile.district_id)
      : Promise.resolve({ data: [], source: "supabase" as const }),
  ]);

  return (
    <EditProfileForm
      profile={profile}
      divisions={divResult.data}
      initialDistricts={districtResult.data}
      initialUpazilas={upazilaResult.data}
      geoSource={divResult.source}
    />
  );
}
