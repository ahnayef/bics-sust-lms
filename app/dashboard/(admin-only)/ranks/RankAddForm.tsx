"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addRank } from "@/server/rank-actions";

export default function RankAddForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    const fd = new FormData();
    fd.append("name", trimmed);
    startTransition(async () => {
      const result = await addRank(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setName("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="rank-name"
          className="block text-xs font-medium text-[#5c4f42] mb-1 ink-text uppercase tracking-wide"
        >
          New rank name
        </label>
        <input
          id="rank-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Quran"
          required
          className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="px-5 py-2 bg-[#3f3328] text-[#f4e8d4] text-sm font-semibold rounded-sm hover:bg-[#221910] disabled:opacity-50 disabled:cursor-not-allowed ink-text shrink-0"
      >
        {isPending ? "Adding…" : "Add Rank"}
      </button>
      {error && (
        <p className="text-sm text-red-700 ink-text sm:col-span-2 w-full">
          {error}
        </p>
      )}
    </form>
  );
}
