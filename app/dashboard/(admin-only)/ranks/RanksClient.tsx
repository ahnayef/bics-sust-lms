"use client";

import { useState } from "react";
import { RankChip } from "./RankChip";

interface Rank {
  id: string;
  name: string;
}

export default function RanksClient({ ranks }: { ranks: Rank[] }) {
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  return (
    <>
      {flash && (
        <div
          className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-sm border text-sm font-medium ink-text shadow-lg transition-all max-w-sm ${
            flash.type === "success"
              ? "bg-[#e8f5e8] border-[#6b9e6b] text-[#2a4a2a]"
              : "bg-[#f5e8e8] border-[#9e6b6b] text-[#4a2a2a]"
          }`}
        >
          {flash.text}
        </div>
      )}
      {ranks.length === 0 ? (
        <p className="text-sm text-[#6a5a4c] ink-text">
          No ranks yet — add one above.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ranks.map((r) => (
            <RankChip
              key={r.id}
              id={r.id}
              name={r.name}
              onFlash={showFlash}
            />
          ))}
        </div>
      )}
    </>
  );
}
