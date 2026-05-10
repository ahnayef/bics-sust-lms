import { getDivisions } from "@/server/geo";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const { data: divisions, source } = await getDivisions();
  return <SetupForm divisions={divisions} geoSource={source} />;
}
