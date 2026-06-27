"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBook, FaCheckCircle, FaHistory, FaListUl, FaMapMarkerAlt, FaMoon, FaPhone, FaShieldAlt, FaSun, FaUser } from "react-icons/fa";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0]?.toUpperCase() ?? "") + (parts[parts.length - 1][0]?.toUpperCase() ?? "");
}

interface ReportClientProps {
  t: any;
  language: string;
  profile: any;
  stats: any;
  checklistProgress: any;
  transactions: any;
  reportDate: string;
  joinedDate: string;
  isOwnReport: boolean;
  isAdminOrMod: boolean;
  backUrl: string;
}

export default function ReportClient({
  t,
  profile,
  stats,
  checklistProgress,
  transactions,
  reportDate,
  joinedDate,
  backUrl,
}: ReportClientProps) {
  const [isWhiteTheme, setIsWhiteTheme] = useState(false);

  return (
    <div className="p-4 sm:p-0 space-y-5">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm text-[#5a4b3f] hover:text-[#221910] transition-colors ink-text"
        >
          <FaHistory className="w-3.5 h-3.5 rotate-180" />
          {t.report.back}
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWhiteTheme(!isWhiteTheme)}
            className="p-2 rounded-sm border border-[#b5a490] bg-[#eadcc8] text-[#4e4033] hover:bg-[#e1d0ba] transition-colors text-sm flex items-center gap-2"
          >
            {isWhiteTheme ? (
              <>
                <FaSun className="w-3.5 h-3.5" />
                {t.report.colorTheme}
              </>
            ) : (
              <>
                <FaMoon className="w-3.5 h-3.5" />
                {t.report.whiteTheme}
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-stone-800 text-stone-100 border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors text-sm font-semibold shrink-0 flex items-center gap-2"
          >
            <FaBook className="w-3.5 h-3.5" />
            {t.report.printReport}
          </button>
        </div>
      </div>

      {/* Report */}
      <div className={`max-w-4xl mx-auto p-4 sm:p-8 space-y-8 my-4 rounded-sm ${isWhiteTheme ? "bg-white shadow-sm" : "dashboard-surface tron-border"}`}>
        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-center gap-6 pb-6 border-b-2 ${isWhiteTheme ? "border-gray-200" : "border-[#8a7966]"}`}>
          <div className={`w-24 h-24 rounded-full ${isWhiteTheme ? "bg-gray-100 border-2 border-gray-200" : "bg-[#d9cbb7] border-2 border-[#8a7966]"} flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden`}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.textContent = getInitials(profile.full_name);
                    fallback.className = 'text-3xl font-bold';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className={isWhiteTheme ? "text-gray-700" : "text-[#4a3e33]"}>
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-title"}`}>
              {profile.full_name}
            </h1>
            <p className={`mb-2 ${isWhiteTheme ? "text-gray-500" : "text-[#6a5a4c] ink-text"}`}>
              @{profile.username} | {profile.email}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
              <span className={`italic ${isWhiteTheme ? "text-gray-500" : "text-[#7a6a5c] ink-text"}`}>
                {t.report.reportGeneratedOn}: {reportDate}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Information */}
          <section className="space-y-4">
            <h2 className={`text-base font-bold pb-2 flex items-center gap-2 border-b ${isWhiteTheme ? "text-gray-900 border-gray-200" : "text-[#221910] ink-title border-[#c9b89a]"}`}>
              <FaUser className={isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"} />
              {t.profile.sections.contactInfo}
            </h2>
            <div className="space-y-3">
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.role}:
                </span>
                <span className={`uppercase flex items-center gap-1 ${isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}`}>
                  <FaShieldAlt className={`w-3 h-3 ${isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"}`} />
                  {t.profile.roles[profile.role as keyof typeof t.profile.roles] || profile.role}
                </span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.rank}:
                </span>
                <span className={isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}>
                  {profile.rank?.name || "N/A"}
                </span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.location}:
                </span>
                <span className={`flex items-center gap-1 ${isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}`}>
                  <FaMapMarkerAlt className={`w-3 h-3 ${isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"}`} />
                  {profile.thana?.name || "N/A"}
                </span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.phone}:
                </span>
                <span className={`flex items-center gap-1 ${isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}`}>
                  <FaPhone className={`w-3 h-3 ${isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"}`} />
                  {profile.phone || "N/A"}
                </span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.memberSince}:
                </span>
                <span className={isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}>
                  {joinedDate}
                </span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isWhiteTheme ? "border-gray-100" : "border-[#eadcc8]"}`}>
                <span className={`font-semibold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                  {t.report.status}:
                </span>
                <span className={`flex items-center gap-1 font-bold ${profile.is_verified ? "text-teal-600" : "text-amber-600"}`}>
                  {profile.is_verified ? <FaCheckCircle /> : null}
                  {profile.is_verified ? t.profile.header.verified : t.users.badges.unverified}
                </span>
              </div>
            </div>
          </section>

          {/* Library Progress */}
          <section className="space-y-4">
            <h2 className={`text-base font-bold pb-2 flex items-center gap-2 border-b ${isWhiteTheme ? "text-gray-900 border-gray-200" : "text-[#221910] ink-title border-[#c9b89a]"}`}>
              <FaBook className={isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"} />
              {t.profile.sections.readingProgress}
            </h2>
            <div className="space-y-5">
              {stats.categoryProgress.map((cp: any) => {
                const percent = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                return (
                  <div key={cp.categoryId} className="space-y-1">
                    <div className={`flex justify-between text-sm font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4a3e33] ink-title"}`}>
                      <span>{cp.categoryName}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden border shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] ${isWhiteTheme ? "bg-gray-200 border-gray-300" : "bg-[#d9cbb7] border-[#8a7966]"}`}>
                      <div
                        className={`h-full transition-all duration-500 ${isWhiteTheme ? "bg-gray-700" : "bg-[#5a4d40]"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className={`text-right text-[10px] font-medium ${isWhiteTheme ? "text-gray-500" : "text-[#7a6a5c] ink-text"}`}>
                      {cp.completed} / {cp.total} {t.profile.stats.booksRead}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Checklist Progress */}
        {checklistProgress.length > 0 && (
          <section className="space-y-4">
            <h2 className={`text-base font-bold pb-2 flex items-center gap-2 border-b ${isWhiteTheme ? "text-gray-900 border-gray-200" : "text-[#221910] ink-title border-[#c9b89a]"}`}>
              <FaListUl className={isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"} />
              {t.report.checklistProgress}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {checklistProgress.map((cp: any) => {
                const percent = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                return (
                  <div key={cp.checklistId} className="space-y-1">
                    <div className={`flex justify-between text-sm font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4a3e33] ink-title"}`}>
                      <span>{cp.checklistName}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden border shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] ${isWhiteTheme ? "bg-gray-200 border-gray-300" : "bg-[#d9cbb7] border-[#8a7966]"}`}>
                      <div
                        className={`h-full transition-all duration-500 ${isWhiteTheme ? "bg-teal-600" : "bg-teal-700"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className={`text-right text-[10px] font-medium ${isWhiteTheme ? "text-gray-500" : "text-[#7a6a5c] ink-text"}`}>
                      {cp.completed} / {cp.total} {t.report.itemsCompleted}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className={`text-base font-bold pb-2 flex items-center gap-2 border-b ${isWhiteTheme ? "text-gray-900 border-gray-200" : "text-[#221910] ink-title border-[#c9b89a]"}`}>
            <FaHistory className={isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"} />
            {t.report.recentLibraryActivity}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className={`border-b ${isWhiteTheme ? "bg-gray-50 border-gray-200" : "bg-[#eadcc8] border-[#b5a490]"}`}>
                  <th className={`py-2 px-3 font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4e4033] ink-title"}`}>
                    {t.report.bookTitle}
                  </th>
                  <th className={`py-2 px-3 font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4e4033] ink-title"}`}>
                    {t.report.type}
                  </th>
                  <th className={`py-2 px-3 font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4e4033] ink-title"}`}>
                    {t.report.status}
                  </th>
                  <th className={`py-2 px-3 font-bold ${isWhiteTheme ? "text-gray-700" : "text-[#4e4033] ink-title"}`}>
                    {t.report.date}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx: any) => (
                  <tr key={tx.id} className={`border-b transition-colors ${isWhiteTheme ? "border-gray-100 hover:bg-gray-50" : "border-[#eadcc8] hover:bg-[#f4ede3]"}`}>
                    <td className={`py-2 px-3 font-medium ${isWhiteTheme ? "text-gray-900" : "text-[#221910] ink-text"}`}>
                      {tx.book?.title || "Unknown"}
                    </td>
                    <td className={`py-2 px-3 uppercase text-[10px] font-bold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                      {tx.type}
                    </td>
                    <td className={`py-2 px-3 uppercase text-[10px] font-bold ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                      {tx.status}
                    </td>
                    <td className={`py-2 px-3 ${isWhiteTheme ? "text-gray-600" : "text-[#6a5a4c] ink-text"}`}>
                      {new Date(tx.request_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center italic ${isWhiteTheme ? "text-gray-500" : "text-[#8a7966]"}`}>
                      {t.report.noRecentActivity}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className={`pt-8 border-t text-center ${isWhiteTheme ? "border-gray-200" : "border-[#c9b89a]"}`}>
          <p className={`text-xs font-bold tracking-widest uppercase ${isWhiteTheme ? "text-gray-400" : "text-[#8a7966]"}`}>
            {t.report.footerText}
          </p>
        </footer>
      </div>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Force background colors to print in browsers */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide interactive elements */
          .no-print, button, a, .report-controls { display: none !important; }
          
          body { background: white !important; }
          
          /* Clean up report container */
          .dashboard-surface, .bg-white { 
            background: white !important; 
            border: none !important; 
            box-shadow: none !important; 
          }
          
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; padding: 20px !important; }
          
          .tron-border { border: none !important; }
          
          table { width: 100% !important; }
        }
      `}} />
    </div>
  );
}
