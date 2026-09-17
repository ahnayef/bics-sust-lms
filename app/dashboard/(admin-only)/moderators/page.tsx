import { redirect } from "next/navigation";

export default function ModeratorsPage() {
  redirect("/dashboard/admins");
}
