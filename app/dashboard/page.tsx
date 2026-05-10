import { redirect } from "next/navigation";

// /dashboard is the canonical "My Profile" URL in the navigation.
// Serve the profile page content from here so the nav active-state works,
// and redirect any direct visits to the canonical profile route.
export default function Page() {
  redirect("/dashboard/profile");
}
