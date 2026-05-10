import { refresh, updateTag } from "next/cache";

/**
 * Invalidates Next.js Cache Component entries (`'use cache'` + `cacheTag`) after
 * library data writes. Call only from Server Actions (or code they invoke).
 */
export function invalidateAfterBookOrCopyMutation() {
  updateTag("books");
  updateTag("copies");
  updateTag("overview");
  refresh();
}

/** Borrow/return/transaction row changes and copy status from those flows. */
export function invalidateAfterTransactionMutation() {
  updateTag("books");
  updateTag("copies");
  updateTag("transactions");
  updateTag("overview");
  updateTag("users");
  refresh();
}

/** PDF submission create/update (queues, syllabus, overview). */
export function invalidateAfterPdfMutation() {
  updateTag("pdf-submissions");
  updateTag("books");
  updateTag("copies");
  updateTag("transactions");
  updateTag("overview");
  updateTag("users");
  refresh();
}

/** Profile verification — affects user list rows and overview member counts. */
export function invalidateUsersAndOverview() {
  updateTag("users");
  updateTag("overview");
  refresh();
}

/** Geo display names embedded in the users directory. */
export function invalidateUsersDirectory() {
  updateTag("users");
  refresh();
}
