"use client";

import { InventoryNav } from "@/app/dashboard/components/StaffHubNav";
import { useTranslation } from "@/lib/i18n/context";
import type {
  Book,
  Category,
  Copy,
  Transaction,
  UserWithStats,
} from "@/types/library";
import { useMemo, useState } from "react";
import {
  FaBook,
  FaCheckSquare,
  FaClipboardList,
  FaDownload,
  FaExchangeAlt,
  FaFileCsv,
  FaFileExport,
  FaFilePdf,
  FaFilter,
  FaGraduationCap,
  FaPrint,
  FaRegSquare,
  FaSearch,
  FaTimes,
  FaUsers,
} from "react-icons/fa";

export type DatasetKey =
  | "books"
  | "copies"
  | "users"
  | "transactions"
  | "categories";

interface StaffInfo {
  name: string;
  email: string;
  role: string;
}

interface Props {
  currentStaff: StaffInfo;
  books: Book[];
  copies: Copy[];
  users: UserWithStats[];
  transactions: Transaction[];
  categories: Category[];
}

interface ColumnDef {
  key: string;
  label: string;
  labelBn: string;
  default: boolean;
  getValue: (item: any) => string | number;
}

function formatDate(
  d: string | null | undefined,
  language: string = "en",
): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  } catch {
    return String(d);
  }
}

export default function ExportsClient({
  currentStaff,
  books,
  copies,
  users,
  transactions,
  categories,
}: Props) {
  const { t, language } = useTranslation();

  // Active dataset
  const [selectedDataset, setSelectedDataset] = useState<DatasetKey>("books");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "month" | "last30" | "year"
  >("all");
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Column definitions per dataset
  const columnsConfig: Record<DatasetKey, ColumnDef[]> = useMemo(
    () => ({
      books: [
        {
          key: "id",
          label: "Book ID",
          labelBn: "বই আইডি",
          default: true,
          getValue: (b: Book) => b.id,
        },
        {
          key: "title",
          label: "Title",
          labelBn: "বইয়ের নাম",
          default: true,
          getValue: (b: Book) => b.title,
        },
        {
          key: "author",
          label: "Author",
          labelBn: "লেখক",
          default: true,
          getValue: (b: Book) => b.author,
        },
        {
          key: "category",
          label: "Category",
          labelBn: "ক্যাটাগরি",
          default: true,
          getValue: (b: Book) => b.category?.name || "—",
        },
        {
          key: "is_syllabus",
          label: "Syllabus",
          labelBn: "সিলেবাস",
          default: true,
          getValue: (b: Book) =>
            b.is_syllabus
              ? language === "bn"
                ? "হ্যাঁ"
                : "Yes"
              : language === "bn"
                ? "না"
                : "No",
        },
        {
          key: "pages",
          label: "Pages",
          labelBn: "পৃষ্ঠা",
          default: false,
          getValue: (b: Book) => b.pages ?? "—",
        },
        {
          key: "copies_count",
          label: "Total Copies",
          labelBn: "মোট কপি",
          default: true,
          getValue: (b: Book) => b.copies?.length ?? 0,
        },
        {
          key: "pdf_link",
          label: "PDF Link",
          labelBn: "পিডিএফ লিংক",
          default: false,
          getValue: (b: Book) => b.pdf_link || "—",
        },
        {
          key: "created_at",
          label: "Added Date",
          labelBn: "সংযোজনের তারিখ",
          default: true,
          getValue: (b: Book) => formatDate(b.created_at, language),
        },
      ],
      copies: [
        {
          key: "id",
          label: "Copy ID",
          labelBn: "কপি আইডি",
          default: true,
          getValue: (c: Copy) => c.id,
        },
        {
          key: "book_title",
          label: "Book Title",
          labelBn: "বইয়ের নাম",
          default: true,
          getValue: (c: Copy) => c.book?.title || "—",
        },
        {
          key: "author",
          label: "Author",
          labelBn: "লেখক",
          default: true,
          getValue: (c: Copy) => c.book?.author || "—",
        },
        {
          key: "copy_number",
          label: "Copy Number",
          labelBn: "কপি নম্বর",
          default: true,
          getValue: (c: Copy) => `#${c.copy_number}`,
        },
        {
          key: "status",
          label: "Status",
          labelBn: "স্ট্যাটাস",
          default: true,
          getValue: (c: Copy) => c.status,
        },
        {
          key: "borrower",
          label: "Current Borrower",
          labelBn: "বর্তমান গ্রহীতা",
          default: false,
          getValue: (c: Copy) => c.borrower?.full_name || "—",
        },
        {
          key: "created_at",
          label: "Added Date",
          labelBn: "সংযোজনের তারিখ",
          default: true,
          getValue: (c: Copy) => formatDate(c.created_at, language),
        },
      ],
      users: [
        {
          key: "id",
          label: "User ID",
          labelBn: "ইউজার আইডি",
          default: false,
          getValue: (u: UserWithStats) => u.id,
        },
        {
          key: "full_name",
          label: "Full Name",
          labelBn: "পুরো নাম",
          default: true,
          getValue: (u: UserWithStats) => u.full_name,
        },
        {
          key: "username",
          label: "Username",
          labelBn: "ইউজারনেম",
          default: true,
          getValue: (u: UserWithStats) => `@${u.username}`,
        },
        {
          key: "email",
          label: "Email",
          labelBn: "ইমেইল",
          default: true,
          getValue: (u: UserWithStats) => u.email,
        },
        {
          key: "phone",
          label: "Phone",
          labelBn: "ফোন নম্বর",
          default: true,
          getValue: (u: UserWithStats) => u.phone || "—",
        },
        {
          key: "role",
          label: "Role",
          labelBn: "রোল",
          default: true,
          getValue: (u: UserWithStats) => u.role,
        },
        {
          key: "is_verified",
          label: "Verified",
          labelBn: "যাচাইকৃত",
          default: true,
          getValue: (u: UserWithStats) =>
            u.is_verified
              ? language === "bn"
                ? "হ্যাঁ"
                : "Verified"
              : language === "bn"
                ? "না"
                : "Unverified",
        },
        {
          key: "rank",
          label: "Rank",
          labelBn: "র‍্যাঙ্ক",
          default: false,
          getValue: (u: UserWithStats) => u.rank?.name || "—",
        },
        {
          key: "thana",
          label: "Thana",
          labelBn: "থানা",
          default: false,
          getValue: (u: UserWithStats) => u.thana?.name || "—",
        },
        {
          key: "active_borrows",
          label: "Active Borrows",
          labelBn: "চলতি বই",
          default: true,
          getValue: (u: UserWithStats) => u.activeBorrows ?? 0,
        },
        {
          key: "created_at",
          label: "Joined Date",
          labelBn: "যোগদানের তারিখ",
          default: true,
          getValue: (u: UserWithStats) => formatDate(u.created_at, language),
        },
      ],
      transactions: [
        {
          key: "id",
          label: "Transaction ID",
          labelBn: "লেনদেন আইডি",
          default: false,
          getValue: (t: Transaction) => t.id,
        },
        {
          key: "user_name",
          label: "Member Name",
          labelBn: "সদস্যের নাম",
          default: true,
          getValue: (t: Transaction) => t.user?.full_name || "—",
        },
        {
          key: "user_email",
          label: "Member Email",
          labelBn: "সদস্যের ইমেইল",
          default: true,
          getValue: (t: Transaction) => t.user?.email || "—",
        },
        {
          key: "book_title",
          label: "Book Title",
          labelBn: "বইয়ের নাম",
          default: true,
          getValue: (t: Transaction) => t.book?.title || "—",
        },
        {
          key: "copy_id",
          label: "Copy ID",
          labelBn: "কপি আইডি",
          default: true,
          getValue: (t: Transaction) => t.copy_id || "—",
        },
        {
          key: "type",
          label: "Type",
          labelBn: "লেনদেনের ধরণ",
          default: true,
          getValue: (t: Transaction) => t.type,
        },
        {
          key: "status",
          label: "Status",
          labelBn: "স্ট্যাটাস",
          default: true,
          getValue: (t: Transaction) => t.status,
        },
        {
          key: "request_date",
          label: "Request Date",
          labelBn: "আবেদনের তারিখ",
          default: true,
          getValue: (t: Transaction) => formatDate(t.request_date, language),
        },
        {
          key: "due_date",
          label: "Due Date",
          labelBn: "ফেরতের মেয়াদ",
          default: true,
          getValue: (t: Transaction) => formatDate(t.due_date, language),
        },
        {
          key: "return_date",
          label: "Returned Date",
          labelBn: "ফেরত দেওয়ার তারিখ",
          default: false,
          getValue: (t: Transaction) => formatDate(t.return_date, language),
        },
      ],
      categories: [
        {
          key: "id",
          label: "Category ID",
          labelBn: "ক্যাটাগরি আইডি",
          default: false,
          getValue: (c: Category) => c.id,
        },
        {
          key: "name",
          label: "Category Name",
          labelBn: "ক্যাটাগরির নাম",
          default: true,
          getValue: (c: Category) => c.name,
        },
        {
          key: "count_in_progress",
          label: "Counts in Progress",
          labelBn: "অগ্রগতিতে গণনা",
          default: true,
          getValue: (c: Category) =>
            c.count_in_progress
              ? language === "bn"
                ? "হ্যাঁ"
                : "Yes"
              : language === "bn"
                ? "না"
                : "No",
        },
        {
          key: "created_at",
          label: "Created Date",
          labelBn: "তৈরির তারিখ",
          default: true,
          getValue: (c: Category) => formatDate(c.created_at, language),
        },
      ],
    }),
    [language],
  );

  // Selected columns state per dataset
  const [selectedColumns, setSelectedColumns] = useState<
    Record<DatasetKey, Set<string>>
  >(() => {
    const initial: any = {};
    for (const key of Object.keys(columnsConfig) as DatasetKey[]) {
      initial[key] = new Set(
        columnsConfig[key].filter((c) => c.default).map((c) => c.key),
      );
    }
    return initial;
  });

  const toggleColumn = (dataset: DatasetKey, colKey: string) => {
    setSelectedColumns((prev) => {
      const currentSet = new Set(prev[dataset]);
      if (currentSet.has(colKey)) {
        if (currentSet.size > 1) {
          currentSet.delete(colKey);
        }
      } else {
        currentSet.add(colKey);
      }
      return { ...prev, [dataset]: currentSet };
    });
  };

  const selectAllColumns = (dataset: DatasetKey) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [dataset]: new Set(columnsConfig[dataset].map((c) => c.key)),
    }));
  };

  const resetDefaultColumns = (dataset: DatasetKey) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [dataset]: new Set(
        columnsConfig[dataset].filter((c) => c.default).map((c) => c.key),
      ),
    }));
  };

  // Date filter predicate
  const matchesDate = (dateString: string | null | undefined) => {
    if (dateFilter === "all" || !dateString) return true;
    const date = new Date(dateString);
    const now = new Date();
    if (dateFilter === "month") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === "last30") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= thirtyDaysAgo;
    }
    if (dateFilter === "year") {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filtered dataset records
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    switch (selectedDataset) {
      case "books":
        return books.filter((b) => {
          const matchQuery =
            !q ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.category?.name && b.category.name.toLowerCase().includes(q));
          const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "syllabus" && b.is_syllabus) ||
            (statusFilter === "additional" && !b.is_syllabus);
          const matchDateFilter = matchesDate(b.created_at);
          return matchQuery && matchStatus && matchDateFilter;
        });

      case "copies":
        return copies.filter((c) => {
          const matchQuery =
            !q ||
            c.id.toLowerCase().includes(q) ||
            (c.book?.title && c.book.title.toLowerCase().includes(q)) ||
            (c.book?.author && c.book.author.toLowerCase().includes(q));
          const matchStatus =
            statusFilter === "all" || c.status === statusFilter;
          const matchDateFilter = matchesDate(c.created_at);
          return matchQuery && matchStatus && matchDateFilter;
        });

      case "users":
        return users.filter((u) => {
          const matchQuery =
            !q ||
            u.full_name.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q));
          const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "verified" && u.is_verified) ||
            (statusFilter === "unverified" && !u.is_verified) ||
            (statusFilter === "staff" &&
              (u.role === "admin" ||
                u.role === "superadmin" ||
                u.role === "moderator"));
          const matchDateFilter = matchesDate(u.created_at);
          return matchQuery && matchStatus && matchDateFilter;
        });

      case "transactions":
        return transactions.filter((tx) => {
          const matchQuery =
            !q ||
            (tx.user?.full_name &&
              tx.user.full_name.toLowerCase().includes(q)) ||
            (tx.book?.title && tx.book.title.toLowerCase().includes(q)) ||
            (tx.copy_id && tx.copy_id.toLowerCase().includes(q));
          const matchStatus =
            statusFilter === "all" || tx.status === statusFilter;
          const matchDateFilter = matchesDate(tx.request_date);
          return matchQuery && matchStatus && matchDateFilter;
        });

      case "categories":
        return categories.filter((c) => {
          const matchQuery = !q || c.name.toLowerCase().includes(q);
          const matchDateFilter = matchesDate(c.created_at);
          return matchQuery && matchDateFilter;
        });

      default:
        return [];
    }
  }, [
    selectedDataset,
    searchTerm,
    statusFilter,
    dateFilter,
    books,
    copies,
    users,
    transactions,
    categories,
  ]);

  // Active column objects
  const activeCols = useMemo(() => {
    const activeSet = selectedColumns[selectedDataset];
    return columnsConfig[selectedDataset].filter((c) => activeSet.has(c.key));
  }, [columnsConfig, selectedDataset, selectedColumns]);

  // CSV Generator
  const handleExportCsv = () => {
    const filename = `sust-pathagar-${selectedDataset}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = activeCols.map((col) =>
      language === "bn" ? col.labelBn : col.label,
    );
    const rows = filteredData.map((item) =>
      activeCols.map((col) => col.getValue(item)),
    );

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent =
      "\uFEFF" +
      [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Print Trigger
  const handlePrintPdf = () => {
    window.print();
  };

  const datasetTitles: Record<DatasetKey, { en: string; bn: string }> = {
    books: { en: "Books Inventory", bn: "বইয়ের ইনভেন্টরি" },
    copies: { en: "Book Copies", bn: "বইয়ের কপি তালিকা" },
    users: { en: "Members & Users", bn: "সদস্য ও ব্যবহারকারী" },
    transactions: { en: "Circulation History", bn: "লেনদেন ও সার্কুলেশন" },
    categories: { en: "Book Categories", bn: "বইয়ের ক্যাটাগরি" },
  };

  const datasetIcons: Record<DatasetKey, any> = {
    books: FaBook,
    copies: FaGraduationCap,
    users: FaUsers,
    transactions: FaExchangeAlt,
    categories: FaClipboardList,
  };

  const datasetCounts: Record<DatasetKey, number> = {
    books: books.length,
    copies: copies.length,
    users: users.length,
    transactions: transactions.length,
    categories: categories.length,
  };

  return (
    <div className="space-y-3 sm:space-y-5 px-2 sm:px-6 lg:px-8 py-3 sm:py-6 print:p-0 print:m-0 print:space-y-0">
      {/* Sub-Navigation (Hidden on mobile for clean native flow) */}
      <div className="hidden md:block print:hidden">
        <InventoryNav />
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Header Card (Hidden on Print)                                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl p-3.5 sm:p-5 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] sm:text-[10px] uppercase tracking-[0.12em] font-semibold">
                <FaFileExport className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>
                  {language === "bn"
                    ? "ডাটা এক্সপোর্ট সেন্টার"
                    : "Data Export Center"}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#eadcc8] border border-[#d2bfa5] text-[11px] font-semibold text-[#3b3026]">
                {language === "bn"
                  ? `${currentStaff.name} দ্বারা চালিত`
                  : `Signed in as ${currentStaff.name}`}
              </span>
            </div>
            <h1 className="text-base sm:text-2xl font-bold text-[#221910] leading-tight ink-title">
              {language === "bn"
                ? "অ্যাপ্লিকেশন ডাটা এক্সপোর্ট"
                : "Export Application Data"}
            </h1>
            <p className="text-xs sm:text-sm text-[#5a4b3f] ink-text mt-0.5">
              {language === "bn"
                ? "বই, কপি, সদস্য তালিকা এবং লেনদেনের ডাটা সিএসভি এবং পিডিএফ ফরম্যাটে ডাউনলোড করুন।"
                : "Export books, copies, members, and circulation logs in CSV and PDF formats."}
            </p>
          </div>

          {/* Quick Action Buttons on Desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={filteredData.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2d4a35] text-[#f4e8d4] border border-[#223929] rounded-lg hover:bg-[#233a2a] transition-all text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaFileCsv className="w-4 h-4" />
              <span>
                {language === "bn" ? "সিএসভি ডাউনলোড" : "Download CSV"}
              </span>
            </button>
            <button
              onClick={handlePrintPdf}
              disabled={filteredData.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#eadcc8] text-[#221910] border border-[#8a7966] rounded-lg hover:bg-[#dfcfb9] transition-all text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaFilePdf className="w-3.5 h-3.5 text-[#9b3a25]" />
              <span>
                {language === "bn" ? "পিডিএফ / প্রিন্ট" : "Print / PDF"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Dataset Selection Cards (Hidden on Print)                         */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="print:hidden space-y-2">
        <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5c4f42] px-1 ink-title">
          {language === "bn" ? "১. ডাটাবেস নির্বাচন করুন" : "1. Select Dataset"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {(Object.keys(datasetTitles) as DatasetKey[]).map((key) => {
            const Icon = datasetIcons[key];
            const isSelected = selectedDataset === key;
            const count = datasetCounts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDataset(key);
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 shadow-xs cursor-pointer ${
                  isSelected
                    ? "bg-[#3f3328] border-[#221910] text-[#f4e8d4] ring-2 ring-[#4e4033]"
                    : "dashboard-surface border-[#8a7966]/50 hover:border-[#6e5d4a] hover:bg-[#f6ecdd]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-[#eadcc8] text-[#221910]"
                        : "bg-[#eadcc8] text-[#3f3328]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[#f4e8d4]/20 text-[#f4e8d4]"
                        : "bg-[#eadcc8] text-[#4e4033]"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div>
                  <p
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isSelected ? "text-[#f4e8d4]" : "text-[#221910]"
                    }`}
                  >
                    {language === "bn"
                      ? datasetTitles[key].bn
                      : datasetTitles[key].en}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? "text-[#c5b090]" : "text-[#7a6a5a]"
                    }`}
                  >
                    {language === "bn" ? "এক্সপোর্টযোগ্য" : "Ready to export"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Filter & Column Selection Toolbar (Hidden on Print)               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl p-3 sm:p-4 border border-[#5f4f40] space-y-3 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5c4f42] ink-title">
            {language === "bn"
              ? "২. ফিল্টার ও কলাম কাস্টমাইজ"
              : "2. Filter & Customize Fields"}
          </h2>
          <button
            type="button"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#8a7966] bg-[#f8f1e6] hover:bg-[#efe4d1] text-[#3f3328] text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <FaFilter className="w-2.5 h-2.5" />
            <span>
              {language === "bn" ? "কলাম নির্বাচন (" : "Select Columns ("}
              {selectedColumns[selectedDataset].size}/
              {columnsConfig[selectedDataset].length})
            </span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder={
                language === "bn" ? "খুঁজুন..." : "Filter records..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7a6a5a] hover:text-[#221910] transition-colors"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text text-xs sm:text-sm cursor-pointer"
            >
              <option value="all">
                {language === "bn" ? "সকল স্ট্যাটাস" : "All Statuses"}
              </option>
              {selectedDataset === "books" && (
                <>
                  <option value="syllabus">
                    {language === "bn" ? "সিলেবাস বই" : "Syllabus Books"}
                  </option>
                  <option value="additional">
                    {language === "bn" ? "অতিরিক্ত বই" : "Additional Books"}
                  </option>
                </>
              )}
              {selectedDataset === "copies" && (
                <>
                  <option value="available">
                    {language === "bn" ? "মজুদ (Available)" : "Available"}
                  </option>
                  <option value="borrowed">
                    {language === "bn" ? "ধারকৃত (Borrowed)" : "Borrowed"}
                  </option>
                  <option value="damaged">
                    {language === "bn" ? "ক্ষতিগ্রস্ত (Damaged)" : "Damaged"}
                  </option>
                </>
              )}
              {selectedDataset === "users" && (
                <>
                  <option value="verified">
                    {language === "bn" ? "যাচাইকৃত (Verified)" : "Verified"}
                  </option>
                  <option value="unverified">
                    {language === "bn"
                      ? "অযাচাইকৃত (Unverified)"
                      : "Unverified"}
                  </option>
                  <option value="staff">
                    {language === "bn" ? "স্টাফ (Admin & Mod)" : "Staff Only"}
                  </option>
                </>
              )}
              {selectedDataset === "transactions" && (
                <>
                  <option value="active">
                    {language === "bn" ? "চলতি (Active)" : "Active Borrows"}
                  </option>
                  <option value="pending">
                    {language === "bn"
                      ? "অনুমোদনের অপেক্ষায় (Pending)"
                      : "Pending"}
                  </option>
                  <option value="overdue">
                    {language === "bn" ? "মেয়াদোত্তীর্ণ (Overdue)" : "Overdue"}
                  </option>
                  <option value="completed">
                    {language === "bn" ? "সম্পন্ন (Completed)" : "Completed"}
                  </option>
                </>
              )}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text text-xs sm:text-sm cursor-pointer"
            >
              <option value="all">
                {language === "bn" ? "সব সময় (All Time)" : "All Time"}
              </option>
              <option value="month">
                {language === "bn" ? "এই মাস (This Month)" : "This Month"}
              </option>
              <option value="last30">
                {language === "bn"
                  ? "বিগত ৩০ দিন (Last 30 Days)"
                  : "Last 30 Days"}
              </option>
              <option value="year">
                {language === "bn" ? "চলতি বছর (This Year)" : "This Year"}
              </option>
            </select>
          </div>
        </div>

        {/* Column Checkboxes Picker (Collapsible Drawer) */}
        {showColumnPicker && (
          <div className="p-3 bg-white/70 rounded-xl border border-[#d2bfa5] space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#d2bfa5]/60">
              <span className="text-xs font-bold text-[#3f3328] uppercase tracking-wider">
                {language === "bn" ? "কলামসমূহ" : "Fields to include in export"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllColumns(selectedDataset)}
                  className="text-[11px] font-bold text-[#2d4a35] hover:underline"
                >
                  {language === "bn" ? "সব নির্বাচন" : "Select All"}
                </button>
                <span className="text-[#8a7966]">•</span>
                <button
                  type="button"
                  onClick={() => resetDefaultColumns(selectedDataset)}
                  className="text-[11px] font-bold text-[#8b2c1a] hover:underline"
                >
                  {language === "bn" ? "ডিফল্ট কলাম" : "Reset Default"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {columnsConfig[selectedDataset].map((col) => {
                const isChecked = selectedColumns[selectedDataset].has(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(selectedDataset, col.key)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isChecked
                        ? "bg-[#eef5e9] border-[#8aa06f] text-[#2d4a35]"
                        : "bg-[#fcf8f3] border-[#e4d4bf] text-[#6a5a4c] hover:bg-[#f8f1e6]"
                    }`}
                  >
                    {isChecked ? (
                      <FaCheckSquare className="w-3.5 h-3.5 text-[#2d4a35] shrink-0" />
                    ) : (
                      <FaRegSquare className="w-3.5 h-3.5 text-[#8a7966] shrink-0" />
                    )}
                    <span className="truncate">
                      {language === "bn" ? col.labelBn : col.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter stats summary */}
        <div className="flex items-center justify-between text-xs text-[#5c4f42] pt-1">
          <span>
            {language === "bn"
              ? `${filteredData.length} টি রেকর্ড পাওয়া গেছে (মোট ${datasetCounts[selectedDataset]} টির মধ্যে)`
              : `Showing ${filteredData.length} of ${datasetCounts[selectedDataset]} records`}
          </span>
          {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8b2c1a] hover:underline"
            >
              <FaTimes className="w-2.5 h-2.5" />
              <span>
                {language === "bn" ? "ফিল্টার মুছুন" : "Clear filters"}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Live Sample Preview Table (Hidden on Print)                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl border border-[#5f4f40] overflow-hidden shadow-xs print:hidden">
        <div className="px-3 sm:px-4 py-2.5 bg-[#eadcc8] border-b border-[#d2bfa5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#221910] uppercase tracking-wider ink-title">
              {language === "bn"
                ? "৩. প্রিভিউ (প্রথম ১০ টি সারি)"
                : "3. Preview (First 10 Rows)"}
            </span>
          </div>
          <span className="text-[11px] text-[#5a4b3f] font-semibold">
            {language === "bn"
              ? `কলাম সংখ্যা: ${activeCols.length}`
              : `${activeCols.length} Columns Active`}
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-[#6a5a4c] ink-text text-xs sm:text-sm">
            {language === "bn"
              ? "ফিল্টারের সাথে মিলে এমন কোনো রেকর্ড পাওয়া যায়নি।"
              : "No records found matching current filters."}
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs ink-text">
                <thead>
                  <tr className="bg-[#f2e7d7] border-b border-[#d2bfa5]">
                    <th className="w-10 px-3 py-2 text-center text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      #
                    </th>
                    {activeCols.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px] whitespace-nowrap"
                      >
                        {language === "bn" ? col.labelBn : col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#d2bfa5] hover:bg-[#efe4d1] transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center text-[#7a6a5a] font-mono">
                        {idx + 1}
                      </td>
                      {activeCols.map((col) => (
                        <td
                          key={col.key}
                          className="px-3 py-2.5 text-[#2b2119] whitespace-nowrap max-w-xs truncate font-medium"
                        >
                          {String(col.getValue(row))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-[#d2bfa5]">
              {filteredData.slice(0, 5).map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 space-y-1.5 hover:bg-[#efe4d1] transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5c4f42]">
                    <span>Record #{idx + 1}</span>
                    <span className="text-[10px] font-mono text-[#7a6a5a]">
                      {activeCols[0]?.getValue(row)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {activeCols.slice(1, 7).map((col) => (
                      <div key={col.key} className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#7a6a5a] font-semibold truncate">
                          {language === "bn" ? col.labelBn : col.label}
                        </p>
                        <p className="font-semibold text-[#221910] truncate">
                          {String(col.getValue(row))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredData.length > 5 && (
                <div className="p-2.5 text-center bg-[#f2e7d7] text-xs font-semibold text-[#5c4f42]">
                  {language === "bn"
                    ? `আরও ${filteredData.length - 5} টি রেকর্ড এক্সপোর্ট ফাইলে অন্তর্ভুক্ত হবে`
                    : `+ ${filteredData.length - 5} more records will be exported`}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Sticky Mobile Export Action Bar (Mobile Only)                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="sm:hidden sticky bottom-16 z-30 -mx-2 -mb-3 p-3 bg-[#3f3328] text-[#f4e8d4] shadow-xl flex items-center justify-between rounded-t-xl border-t border-[#6e5d4a] print:hidden">
        <div>
          <p className="text-xs font-bold leading-tight truncate">
            {filteredData.length}{" "}
            {language === "bn" ? "টি রেকর্ড" : "records ready"}
          </p>
          <p className="text-[10px] text-[#c5b090] truncate">
            {language === "bn"
              ? datasetTitles[selectedDataset].bn
              : datasetTitles[selectedDataset].en}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2d4a35] text-[#f4e8d4] border border-[#223929] text-xs font-bold rounded-lg shadow-xs active:scale-95 transition-all"
          >
            <FaDownload className="w-3 h-3" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#eadcc8] text-[#221910] text-xs font-bold rounded-lg shadow-xs active:scale-95 transition-all"
          >
            <FaPrint className="w-3 h-3" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Printable Report View (Visible ONLY when printing / Save as PDF)  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div
        id="export-print-area"
        className="hidden print:block w-full text-black bg-white"
      >
        {/* Letterhead Header */}
        <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider font-sans">
              SUST Pathagar
            </h1>
            <h2 className="text-base font-bold text-gray-800 mt-0.5">
              {datasetTitles[selectedDataset].en} /{" "}
              {datasetTitles[selectedDataset].bn}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Generated on:{" "}
              {new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}{" "}
              (Bangladesh Standard Time)
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Staff: {currentStaff.name}</p>
            <p className="text-gray-600 capitalize">
              Role: {currentStaff.role}
            </p>
            <p className="text-gray-600 font-semibold mt-1">
              Total Records: {filteredData.length}
            </p>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mb-3 p-2 bg-gray-50 border border-gray-300 text-xs flex justify-between">
          <span>
            <strong>Status Filter:</strong> {statusFilter}
          </span>
          <span>
            <strong>Date Range:</strong> {dateFilter}
          </span>
          {searchTerm && (
            <span>
              <strong>Search Query:</strong> &quot;{searchTerm}&quot;
            </span>
          )}
        </div>

        {/* Data Table */}
        <table className="w-full text-left text-[10px] border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-400">
              <th className="border border-gray-400 p-1.5 w-8 text-center font-bold">
                #
              </th>
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  className="border border-gray-400 p-1.5 font-bold uppercase"
                >
                  {col.label} / {col.labelBn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                style={{ pageBreakInside: "avoid" }}
              >
                <td className="border border-gray-400 p-1.5 text-center font-mono">
                  {idx + 1}
                </td>
                {activeCols.map((col) => (
                  <td key={col.key} className="border border-gray-400 p-1.5">
                    {String(col.getValue(row))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-400 flex justify-between items-center text-[10px] text-gray-600">
          <span>Official Report — SUST Pathagar</span>
          <span>Printed on A4 Document</span>
        </div>
      </div>
    </div>
  );
}
