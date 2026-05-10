import { getDivisions } from "@/server/geo";
import { createClient } from "@/lib/supabase/server";
import { FaMapMarkerAlt } from "react-icons/fa";
import { UpazilaChip } from "./UpazilaChip";
import ThanaAddForm from "./ThanaAddForm";

export default async function ThanasPage() {
  const { data: divisions } = await getDivisions();

  // Fetch all districts and upazilas for display
  const supabase = await createClient();
  const { data: allDistricts } = await supabase
    .from("districts")
    .select("id, division_id, name")
    .order("name");
  const { data: allUpazilas } = await supabase
    .from("upazilas")
    .select("id, district_id, name")
    .order("name");

  const districts = allDistricts ?? [];
  const upazilas = allUpazilas ?? [];

  // Group for display: division → districts → upazilas
  const districtsByDivision = divisions.map((div) => ({
    ...div,
    districts: districts.filter((d) => d.division_id === div.id),
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <FaMapMarkerAlt className="w-5 h-5 text-[#5a4d40]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
            Location Management
          </h1>
        </div>
        <p className="text-[#5a4b3f] ink-text mt-1 ml-8">
          Manage upazilas used in member profiles. Divisions and districts are
          seeded from the national registry — add missing upazilas here.
        </p>
        <div className="flex gap-4 mt-4 ml-8 text-sm ink-text text-[#5a4b3f]">
          <span>
            <span className="font-semibold text-[#221910]">
              {divisions.length}
            </span>{" "}
            divisions
          </span>
          <span>
            <span className="font-semibold text-[#221910]">
              {districts.length}
            </span>{" "}
            districts
          </span>
          <span>
            <span className="font-semibold text-[#221910]">
              {upazilas.length}
            </span>{" "}
            upazilas
          </span>
        </div>
      </div>

      {/* Add upazila form */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#3b3026] ink-title mb-4 uppercase tracking-[0.06em]">
          Add Missing Upazila
        </h2>
        <ThanaAddForm districtsByDivision={districtsByDivision} />
        <p className="mt-3 text-xs text-[#7a6a5c] ink-text">
          Note: Run{" "}
          <code className="bg-[#eadcc8] px-1 rounded">
            scripts/seed_bd_geo.py
          </code>{" "}
          to bulk-import all ~495 upazilas from the national registry.
        </p>
      </div>

      {/* Hierarchy view */}
      {districtsByDivision.map((div) => {
        const divDistricts = div.districts;
        if (divDistricts.length === 0) return null;

        return (
          <div
            key={div.id}
            className="dashboard-surface tron-border rounded-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#c5ae90] bg-[#eadcc8] flex items-center gap-2">
              <FaMapMarkerAlt className="w-4 h-4 text-[#5a4d40]" />
              <h2 className="text-base font-semibold text-[#3b3026] ink-title uppercase tracking-[0.06em]">
                {div.name} Division
              </h2>
            </div>

            <div className="divide-y divide-[#d2bfa5]">
              {divDistricts.map((district) => {
                const distUpazilas = upazilas.filter(
                  (u) => u.district_id === district.id,
                );
                return (
                  <div key={district.id} className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#3b3026] ink-text mb-2">
                      {district.name} District
                      <span className="ml-2 text-xs font-normal text-[#7a6a5c]">
                        ({distUpazilas.length} upazilas)
                      </span>
                    </p>
                    {distUpazilas.length === 0 ? (
                      <p className="text-xs text-[#8a7966] ink-text italic">
                        No upazilas yet — add one above or run the seed script.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {distUpazilas.map((u) => (
                          <UpazilaChip key={u.id} id={u.id} name={u.name} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
