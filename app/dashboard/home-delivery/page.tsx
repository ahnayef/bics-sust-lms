import PageTransition from "@/components/PageTransition";
import { getThanas } from "@/server/geo";
import { getBooks, getCategories } from "@/server/library";
import { getClaims, getCurrentProfile } from "@/server/user";
import { redirect } from "next/navigation";
import HomeDeliveryClient from "./HomeDeliveryClient";

export default async function HomeDeliveryPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, books, categories, thanasResult] = await Promise.all([
    getCurrentProfile(),
    getBooks(),
    getCategories(),
    getThanas(),
  ]);

  return (
    <PageTransition>
      <HomeDeliveryClient
        profile={profile}
        books={books}
        categories={categories}
        thanas={thanasResult.data || []}
      />
    </PageTransition>
  );
}
