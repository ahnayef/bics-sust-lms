import type { Profile } from "./profile";

// ── Status enums ────────────────────────────────────────────────────────────

export type CopyStatus = "available" | "borrowed" | "damaged";
export type TransactionType = "borrow" | "return";
export type TransactionStatus =
  | "pending"
  | "active"
  | "overdue"
  | "completed"
  | "rejected";
export type PdfSubmissionStatus = "pending" | "approved" | "rejected";

// ── Core entities ───────────────────────────────────────────────────────────

export interface Book {
  id: string; // UUID
  title: string;
  author: string;
  is_syllabus: boolean;
  pages: number | null;
  pdf_link: string | null;
  created_at: string;
  updated_at: string;
  // joined
  copies?: Copy[];
}

export interface Copy {
  id: string; // QR code text, e.g. "QR001"
  book_id: string;
  copy_number: number;
  status: CopyStatus;
  created_at: string;
  updated_at: string;
  // joined
  book?: Pick<Book, "id" | "title" | "author" | "is_syllabus" | "pages" | "pdf_link">;
}

export interface Transaction {
  id: string;
  user_id: string;
  copy_id: string;
  book_id: string;
  type: TransactionType;
  status: TransactionStatus;
  request_date: string;
  approved_date: string | null;
  due_date: string | null;
  return_date: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  user?: Pick<Profile, "id" | "full_name" | "username" | "email" | "avatar_url">;
  copy?: Pick<Copy, "id" | "copy_number" | "status" | "book_id">;
  book?: Pick<Book, "id" | "title" | "author" | "is_syllabus">;
  reviewer?: Pick<Profile, "id" | "full_name">;
}

export interface PdfSubmission {
  id: string;
  user_id: string;
  book_id: string;
  read_date: string | null;
  note: string | null;
  status: PdfSubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  // joined
  user?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url">;
  book?: Pick<Book, "id" | "title" | "author" | "is_syllabus">;
  reviewer?: Pick<Profile, "id" | "full_name">;
}

// ── Aggregate / computed ─────────────────────────────────────────────────────

export interface UserStats {
  syllabusCompleted: number;
  syllabusTotal: number;
  activeBorrows: number;
  pendingRequests: number;
  currentBorrows: Transaction[];
}

export interface UserWithStats extends Profile {
  syllabusCompleted: number;
  syllabusTotal: number;
  activeBorrows: number;
  pendingRequests: number;
}
