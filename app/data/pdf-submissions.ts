// PDF Self-Report Submission types and mock data
export type PdfSubmissionStatus = "pending" | "approved" | "rejected";

export interface PdfReadSubmission {
  id: string;
  memberId: string;
  memberName: string;
  bookId: number;
  bookTitle: string;
  readDate: string; // YYYY-MM-DD
  note?: string;
  source: "pdf"; // always "pdf"
  status: PdfSubmissionStatus;
  submittedAt: string; // ISO timestamp
  reviewedAt?: string; // ISO timestamp
  reviewedBy?: string; // moderator/admin name or id
  rejectionReason?: string;
}

// Mock submissions initialized (member-204 is the current logged-in member)
export const MOCK_PDF_SUBMISSIONS: PdfReadSubmission[] = [
  {
    id: "pdf-sub-001",
    memberId: "Member-204",
    memberName: "Mahmudul Hasan",
    bookId: 2,
    bookTitle: "পর্দা ও ইসলাম",
    readDate: "2026-04-10",
    note: "Finished reading the digital copy",
    source: "pdf",
    status: "approved",
    submittedAt: "2026-04-10T14:30:00Z",
    reviewedAt: "2026-04-11T09:00:00Z",
    reviewedBy: "Admin User",
  },
  {
    id: "pdf-sub-002",
    memberId: "Member-204",
    memberName: "Mahmudul Hasan",
    bookId: 5,
    bookTitle: "ইসলামী অর্থনীতি",
    readDate: "2026-04-12",
    note: "",
    source: "pdf",
    status: "pending",
    submittedAt: "2026-04-12T16:45:00Z",
  },
  {
    id: "pdf-sub-003",
    memberId: "Member-204",
    memberName: "Mahmudul Hasan",
    bookId: 7,
    bookTitle: "খেলাফত ও রাজতন্ত্র",
    readDate: "2026-04-08",
    source: "pdf",
    status: "rejected",
    submittedAt: "2026-04-08T10:15:00Z",
    reviewedAt: "2026-04-09T11:30:00Z",
    reviewedBy: "Moderator",
    rejectionReason: "Book not in your borrowing history. Please borrow first.",
  },
];

// Helper to get submissions for a member
export function getSubmissionsForMember(memberId: string): PdfReadSubmission[] {
  return MOCK_PDF_SUBMISSIONS.filter((sub) => sub.memberId === memberId);
}

// Helper to get approved unique books for progress calculation
export function getApprovedBooksForMember(memberId: string): number[] {
  const submissions = getSubmissionsForMember(memberId);
  const approvedBooks = submissions
    .filter((sub) => sub.status === "approved")
    .map((sub) => sub.bookId);
  return [...new Set(approvedBooks)]; // deduplicate
}

// Helper to check if member has pending/approved submission for a book
export function hasExistingSubmissionForBook(
  memberId: string,
  bookId: number,
  excludeStatuses?: PdfSubmissionStatus[],
): boolean {
  const submissions = getSubmissionsForMember(memberId);
  return submissions.some((sub) => {
    if (sub.bookId !== bookId) return false;
    if (excludeStatuses && excludeStatuses.includes(sub.status)) return false;
    return true;
  });
}

// Helper to get pending submissions (for moderator queue)
export function getPendingSubmissions(): PdfReadSubmission[] {
  return MOCK_PDF_SUBMISSIONS.filter((sub) => sub.status === "pending");
}

// Helper to update submission status (moderator approve/reject)
export function updateSubmissionStatus(
  submissionId: string,
  newStatus: PdfSubmissionStatus,
  reviewedBy?: string,
  rejectionReason?: string,
): PdfReadSubmission | null {
  const submission = MOCK_PDF_SUBMISSIONS.find(
    (sub) => sub.id === submissionId,
  );
  if (!submission) return null;

  submission.status = newStatus;
  submission.reviewedAt = new Date().toISOString();
  if (reviewedBy) submission.reviewedBy = reviewedBy;
  if (rejectionReason) submission.rejectionReason = rejectionReason;

  return submission;
}

// Helper to add new submission
export function addNewSubmission(
  memberId: string,
  memberName: string,
  bookId: number,
  bookTitle: string,
  readDate: string,
  note?: string,
): PdfReadSubmission {
  const newId = `pdf-sub-${String(MOCK_PDF_SUBMISSIONS.length + 1).padStart(3, "0")}`;
  const submission: PdfReadSubmission = {
    id: newId,
    memberId,
    memberName,
    bookId,
    bookTitle,
    readDate,
    note,
    source: "pdf",
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  MOCK_PDF_SUBMISSIONS.push(submission);
  return submission;
}
