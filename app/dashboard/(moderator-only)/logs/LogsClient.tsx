"use client";

import type { ActionLog } from "@/types/library";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  FaDownload, 
  FaFilter,
  FaUserCheck, 
  FaUserTimes, 
  FaShieldAlt, 
  FaUserPlus, 
  FaUser, 
  FaUserCog, 
  FaServer, 
  FaInfoCircle
} from "react-icons/fa";
import Link from "next/link";

export default function LogsClient({
  initialLogs,
  currentDays,
}: {
  initialLogs: ActionLog[];
  currentDays: number;
}) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(`/dashboard/logs?days=${val}`);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = ["Date", "Action Type", "Actor", "Target", "Details"];
      
      const rows = initialLogs.map((log) => {
        const actorName = log.actor?.full_name ?? log.actor?.username ?? "System";
        const targetName = log.target?.full_name ?? log.target?.username ?? "Unknown Target";
        
        return [
          new Date(log.created_at).toISOString(),
          log.action_type,
          `"${actorName.replace(/"/g, '""')}"`,
          `"${targetName.replace(/"/g, '""')}"`,
          `"${(log.details ?? "").replace(/"/g, '""')}"`
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `admin_logs_last_${currentDays}_days.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#221910] ink-title">
            Admin Action Logs
          </h1>
          <p className="text-sm text-[#5a4b3f] ink-text mt-1">
            System events, verifications, and role changes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-[#8a7a6c] w-3 h-3" />
            </div>
            <select
              value={currentDays}
              onChange={handleRangeChange}
              className="pl-8 pr-8 py-2 text-sm bg-[#fcf9f4] border border-[#d3c1a9] rounded-sm focus:ring-2 focus:ring-[#c9b89a] focus:border-[#c9b89a] transition-all text-[#3f3328] font-medium w-full sm:w-auto appearance-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || initialLogs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3f3328] hover:bg-[#4a3d31] disabled:opacity-50 disabled:cursor-not-allowed text-[#fcf9f4] text-sm font-semibold rounded-sm transition-colors"
          >
            <FaDownload className="w-3.5 h-3.5" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-[600px]">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 py-3 text-left font-bold text-[#221910]">Date</th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">Action</th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">Actor</th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">Target</th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4d4bf]">
              {initialLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#6a5a4c]">
                    No logs found for the selected time range.
                  </td>
                </tr>
              ) : (
                initialLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#f4e8d4]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-[#5a4b3f] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        let config = { icon: FaInfoCircle, color: "bg-[#f4e8d4] text-[#4a3e33] border-[#d3c1a9]", label: log.action_type.replace(/_/g, " ") };
                        if (log.action_type === "user_verified") config = { icon: FaUserCheck, color: "bg-[#f4e8d4] text-blue-700 border-[#d3c1a9]", label: "Verified" };
                        else if (log.action_type === "user_unverified") config = { icon: FaUserTimes, color: "bg-[#f4e8d4] text-red-700 border-[#d3c1a9]", label: "Unverified" };
                        else if (log.action_type === "role_changed") config = { icon: FaShieldAlt, color: "bg-[#f4e8d4] text-purple-700 border-[#d3c1a9]", label: "Role Changed" };
                        else if (log.action_type === "user_joined") config = { icon: FaUserPlus, color: "bg-[#f4e8d4] text-green-700 border-[#d3c1a9]", label: "User Joined" };
                        
                        const Icon = config.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#e4d4bf] border border-[#c9b89a] flex items-center justify-center shrink-0">
                          {log.actor?.id ? <FaUserCog className="w-3 h-3 text-[#5a4b3f]" /> : <FaServer className="w-3 h-3 text-[#5a4b3f]" />}
                        </div>
                        {log.actor?.id ? (
                          <Link href={`/dashboard/users/${log.actor.id}`} className="font-semibold text-[#221910] hover:underline hover:text-[#5a4b3f]">
                            {log.actor.full_name ?? log.actor.username}
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#5a4b3f]">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f4e8d4] border border-[#d3c1a9] flex items-center justify-center shrink-0">
                          <FaUser className="w-3 h-3 text-[#7a6a5c]" />
                        </div>
                        {log.target?.id ? (
                          <Link href={`/dashboard/users/${log.target.id}`} className="font-semibold text-[#221910] hover:underline hover:text-[#5a4b3f]">
                            {log.target.full_name ?? log.target.username}
                          </Link>
                        ) : (
                          <span className="font-medium text-[#7a6a5c]">Unknown</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5a4b3f]">
                      {log.details ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
