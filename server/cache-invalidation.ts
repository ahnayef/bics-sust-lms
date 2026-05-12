import { refresh, updateTag } from "next/cache";

/** Helper to ensure cache is invalidated */
function clearTag(tag: string) {
  updateTag(tag);
}

/**
 * Invalidates Next.js Cache Component entries (`'use cache'` + `cacheTag`) after
 * library data writes. Call only from Server Actions (or code they invoke).
 */
export function invalidateAfterBookOrCopyMutation() {
  clearTag("books");
  clearTag("copies");
  clearTag("overview");
  refresh();
}

/** Borrow/return/transaction row changes and copy status from those flows. */
export function invalidateAfterTransactionMutation() {
  clearTag("books");
  clearTag("copies");
  clearTag("transactions");
  clearTag("overview");
  clearTag("users");
  refresh();
}

/** PDF submission create/update (queues, syllabus, overview). */
export function invalidateAfterPdfMutation() {
  clearTag("pdf-submissions");
  clearTag("books");
  clearTag("copies");
  clearTag("transactions");
  clearTag("overview");
  clearTag("users");
  refresh();
}

/** Profile verification — affects user list rows and overview member counts. */
export function invalidateUsersAndOverview() {
  clearTag("users");
  clearTag("overview");
  refresh();
}

/** Geo display names embedded in the users directory. */
export function invalidateUsersDirectory() {
  clearTag("users");
  refresh();
}
