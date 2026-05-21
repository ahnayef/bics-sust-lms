"use client";

import { useTranslation } from "@/lib/i18n/context";
import type { ActionLog } from "@/types/library";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaExclamationTriangle,
  FaFilter,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaServer,
  FaShieldAlt,
  FaUser,
  FaUserCheck,
  FaUserCog,
  FaUserPlus,
  FaUserTimes,
} from "react-icons/fa";

function parseErrorDetails(details: string | null): { action: string; error: string } | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details);
    if (parsed.action && parsed.error) return parsed;
  } catch {
    // not JSON
  }
  return null;
}

export default function LogsClient({
  initialLogs,
  currentDays,
}: {
  initialLogs: ActionLog[];
  currentDays: number;
}) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<"all" | "errors" | "actions">("all");

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLogs = initialLogs.filter((log) => {
    if (filterType === "errors") return log.action_type === "error";
    if (filterType === "actions") return log.action_type !== "error";
    return true;
  });

  const errorCount = initialLogs.filter((l) => l.action_type === "error").length;

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(`/dashboard/logs?days=${val}`);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = [
        t.logs.export.headers.date,
        t.logs.export.headers.actionType,
        t.logs.export.headers.actor,
        t.logs.export.headers.target,
        t.logs.export.headers.details,
      ];

      const rows = initialLogs.map((log) => {
        const actorName = log.actor?.full_name ?? log.actor?.username ?? t.logs.table.system;
        const targetName =
          log.target?.full_name ?? log.target?.username ?? t.logs.table.unknownTarget;

        return [
          new Date(log.created_at).toISOString(),
          log.action_type,
          `"${actorName.replace(/"/g, '""')}"`,
          `"${targetName.replace(/"/g, '""')}"`,
          `"${(log.details ?? "").replace(/"/g, '""')}"`,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        t.logs.export.filename.replace("{days}", currentDays.toString())
      );
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
            {t.logs.title}
          </h1>
          <p className="text-sm text-[#5a4b3f] ink-text mt-1">
            {t.logs.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-[#8a7a6c] w-3 h-3" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="pl-8 pr-8 py-2 text-sm bg-[#fcf9f4] border border-[#d3c1a9] rounded-sm focus:ring-2 focus:ring-[#c9b89a] focus:border-[#c9b89a] transition-all text-[#3f3328] font-medium w-full sm:w-auto appearance-none"
            >
              <option value="all">{t.logs.filters.all}</option>
              <option value="errors">
                {t.logs.filters.errorsOnly.replace("{count}", errorCount.toString())}
              </option>
              <option value="actions">{t.logs.filters.actionsOnly}</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-[#8a7a6c] w-3 h-3" />
            </div>
            <select
              value={currentDays}
              onChange={handleRangeChange}
              className="pl-8 pr-8 py-2 text-sm bg-[#fcf9f4] border border-[#d3c1a9] rounded-sm focus:ring-2 focus:ring-[#c9b89a] focus:border-[#c9b89a] transition-all text-[#3f3328] font-medium w-full sm:w-auto appearance-none"
            >
              <option value="7">{t.logs.filters.last7Days}</option>
              <option value="30">{t.logs.filters.last30Days}</option>
              <option value="90">{t.logs.filters.last90Days}</option>
              <option value="365">{t.logs.filters.lastYear}</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || initialLogs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3f3328] hover:bg-[#4a3d31] disabled:opacity-50 disabled:cursor-not-allowed text-[#fcf9f4] text-sm font-semibold rounded-sm transition-colors"
          >
            <FaDownload className="w-3.5 h-3.5" />
            {isExporting ? t.logs.export.exporting : t.logs.export.button}
          </button>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-[600px]">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 py-3 text-left font-bold text-[#221910]">
                  {t.logs.table.date}
                </th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">
                  {t.logs.table.action}
                </th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">
                  {t.logs.table.actor}
                </th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]">
                  {t.logs.table.targetDetails}
                </th>
                <th className="px-4 py-3 text-left font-bold text-[#221910]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4d4bf]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#6a5a4c]">
                    {t.logs.table.noLogs}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isError = log.action_type === "error";
                  const errorDetails = isError ? parseErrorDetails(log.details) : null;
                  const isExpanded = expandedRows.has(log.id);

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${isError ? "bg-[#f8e7e3] hover:bg-[#f3dbd5]" : "hover:bg-[#f4e8d4]/50"}`}
                    >
                      <td className="px-4 py-3 text-[#5a4b3f] whitespace-nowrap align-top">
                        {new Date(log.created_at).toLocaleString(
                          language === "bn" ? "bn-BD" : "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {(() => {
                          let config = {
                            icon: FaInfoCircle,
                            color: "bg-[#f4e8d4] text-[#4a3e33] border-[#d3c1a9]",
                            label: t.logs.actions[log.action_type as keyof typeof t.logs.actions] || log.action_type.replace(/_/g, " "),
                          };
                          if (log.action_type === "error")
                            config = {
                              icon: FaExclamationTriangle,
                              color: "bg-[#f3dbd5] text-[#8b2c1a] border-[#d0604a]",
                              label: t.logs.actions.error,
                            };
                          else if (log.action_type === "user_verified")
                            config = {
                              icon: FaUserCheck,
                              color: "bg-[#f4e8d4] text-blue-700 border-[#d3c1a9]",
                              label: t.logs.actions.user_verified,
                            };
                          else if (log.action_type === "user_unverified")
                            config = {
                              icon: FaUserTimes,
                              color: "bg-[#f4e8d4] text-red-700 border-[#d3c1a9]",
                              label: t.logs.actions.user_unverified,
                            };
                          else if (log.action_type === "role_changed")
                            config = {
                              icon: FaShieldAlt,
                              color: "bg-[#f4e8d4] text-purple-700 border-[#d3c1a9]",
                              label: t.logs.actions.role_changed,
                            };
                          else if (log.action_type === "user_joined")
                            config = {
                              icon: FaUserPlus,
                              color: "bg-[#f4e8d4] text-green-700 border-[#d3c1a9]",
                              label: t.logs.actions.user_joined,
                            };
                          else if (log.action_type === "thana_deleted")
                            config = {
                              icon: FaMapMarkerAlt,
                              color: "bg-[#f4e8d4] text-orange-700 border-[#d3c1a9]",
                              label: t.logs.actions.thana_deleted,
                            };

                          const Icon = config.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${config.color}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                              {config.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#e4d4bf] border border-[#c9b89a] flex items-center justify-center shrink-0">
                            {log.actor?.id ? (
                              <FaUserCog className="w-3 h-3 text-[#5a4b3f]" />
                            ) : (
                              <FaServer className="w-3 h-3 text-[#5a4b3f]" />
                            )}
                          </div>
                          {log.actor?.id ? (
                            <Link
                              href={`/dashboard/users/${log.actor.id}`}
                              className="font-semibold text-[#221910] hover:underline hover:text-[#5a4b3f]"
                            >
                              {log.actor.full_name ?? log.actor.username}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[#5a4b3f]">{t.logs.table.system}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isError && errorDetails ? (
                          <div className="space-y-1">
                            <p className="text-sm text-[#8b2c1a] font-medium">
                              {errorDetails.action}: {errorDetails.error}
                            </p>
                            {isExpanded && (
                              <pre className="mt-2 p-3 bg-[#f3dbd5] border border-[#d0604a] rounded-sm text-xs text-[#6f3d35] overflow-x-auto whitespace-pre-wrap break-words">
                                {JSON.stringify(errorDetails, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : isError ? (
                          <div className="space-y-1">
                            <p className="text-sm text-[#8b2c1a]">{log.details ?? t.logs.table.unknownError}</p>
                            {isExpanded && log.details && (
                              <pre className="mt-2 p-3 bg-[#f3dbd5] border border-[#d0604a] rounded-sm text-xs text-[#6f3d35] overflow-x-auto whitespace-pre-wrap break-words">
                                {log.details}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#f4e8d4] border border-[#d3c1a9] flex items-center justify-center shrink-0">
                                <FaUser className="w-3 h-3 text-[#7a6a5c]" />
                              </div>
                              {log.target?.id ? (
                                <Link
                                  href={`/dashboard/users/${log.target.id}`}
                                  className="font-semibold text-[#221910] hover:underline hover:text-[#5a4b3f]"
                                >
                                  {log.target.full_name ?? log.target.username}
                                </Link>
                              ) : (
                                <span className="font-medium text-[#7a6a5c]">{t.logs.table.unknown}</span>
                              )}
                            </div>
                            {log.details && (
                              <p className="text-xs text-[#5a4b3f] mt-1">{log.details}</p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isError && (
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#8b2c1a] hover:bg-[#f3dbd5] rounded-sm transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                {t.logs.table.hide} <FaChevronUp className="w-2.5 h-2.5" />
                              </>
                            ) : (
                              <>
                                {t.logs.table.fullDetails} <FaChevronDown className="w-2.5 h-2.5" />
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
