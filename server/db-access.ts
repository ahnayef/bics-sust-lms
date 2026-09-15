import {
  getProfileById,
  getProfileByUsername,
  getProfileByEmail,
  getProfileByUsernameExcludingId,
  upsertProfile,
  updateProfile,
} from "@/lib/db/queries/profiles";
import {
  getBookById,
  insertBook,
  updateBook,
  deleteBook,
} from "@/lib/db/queries/books";
import {
  getCopyById,
  insertCopy,
  updateCopy,
  deleteCopy,
  getBorrowedCopiesCountByBookId,
  getMaxCopyNumber,
  getCopyStatus,
} from "@/lib/db/queries/copies";
import {
  getTransactionById,
  getDuplicateTransaction,
  createTransaction,
  updateTransaction,
  updateBorrowStatus,
  getTransactionsByUserId,
  getAllTransactions,
} from "@/lib/db/queries/transactions";
import {
  getDuplicatePdfSubmission,
  createPdfSubmission,
  updatePdfSubmission,
  getPdfSubmissionsByUserId,
  getAllPdfSubmissions,
} from "@/lib/db/queries/pdfSubmissions";
import { insertActionLog } from "@/lib/db/queries/actionLogs";

// Re-export all functions for backward compatibility
export {
  getProfileById,
  getProfileByUsername,
  getProfileByEmail,
  getProfileByUsernameExcludingId,
  upsertProfile,
  updateProfile,
  getBookById,
  insertBook,
  updateBook,
  deleteBook,
  getCopyById,
  insertCopy,
  updateCopy,
  deleteCopy,
  getBorrowedCopiesCountByBookId,
  getMaxCopyNumber,
  getCopyStatus,
  getTransactionById,
  getDuplicateTransaction,
  createTransaction,
  updateTransaction,
  updateBorrowStatus,
  getTransactionsByUserId,
  getAllTransactions,
  getDuplicatePdfSubmission,
  createPdfSubmission,
  updatePdfSubmission,
  getPdfSubmissionsByUserId,
  getAllPdfSubmissions,
  insertActionLog,
};

// Keep existing function names that might still be used
export const getBookWithCopies = getBookById;
export const getCopyByQR = getCopyById;
