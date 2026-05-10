"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { addThana } from "@/server/geo-actions";
import ConfirmModal from "@/components/ui/confirm-modal";

interface District {
  id: string;
  division_id: string;
  name: string;
}

interface DivisionWithDistricts {
  id: string;
  name: string;
  districts: District[];
}

interface Props {
  districtsByDivision: DivisionWithDistricts[];
}

export default function ThanaAddForm({ districtsByDivision }: Props) {
  const router = useRouter();

  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [upazilaName, setUpazilaName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Flat list for district name lookup
  const allDistricts = districtsByDivision.flatMap((div) => div.districts);
  const selectedDistrict = allDistricts.find((d) => d.id === selectedDistrictId);

  function handleOpenConfirm() {
    if (!selectedDistrictId || !upazilaName.trim()) return;
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setLoading(true);
    const fd = new FormData();
    fd.append("district_id", selectedDistrictId);
    fd.append("name", upazilaName.trim());
    startTransition(async () => {
      await addThana(fd);
      setLoading(false);
      setConfirmOpen(false);
      setSelectedDistrictId("");
      setUpazilaName("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedDistrictId}
          onChange={(e) => setSelectedDistrictId(e.target.value)}
          className="px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
        >
          <option value="" disabled>
            Select district…
          </option>
          {districtsByDivision.map((div) =>
            div.districts.length > 0 ? (
              <optgroup key={div.id} label={div.name}>
                {div.districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
        <input
          type="text"
          placeholder="Upazila name…"
          value={upazilaName}
          onChange={(e) => setUpazilaName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleOpenConfirm();
            }
          }}
          className="px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text placeholder:text-[#9a8a7a]"
        />
        <button
          type="button"
          onClick={handleOpenConfirm}
          disabled={!selectedDistrictId || !upazilaName.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium text-sm ink-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus className="w-4 h-4" />
          Add Upazila
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          if (!loading) setConfirmOpen(false);
        }}
        onConfirm={handleConfirm}
        title="Add Upazila"
        preview={
          <div className="space-y-1">
            <p>
              <span className="text-[#7a6a5c]">District:</span>{" "}
              {selectedDistrict?.name ?? "—"}
            </p>
            <p>
              <span className="text-[#7a6a5c]">Upazila:</span>{" "}
              {upazilaName.trim()}
            </p>
          </div>
        }
        confirmLabel="Add"
        loading={loading}
      />
    </>
  );
}
