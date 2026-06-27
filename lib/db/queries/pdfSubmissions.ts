import { db } from "@/lib/db";
import { retry } from "@/lib/db/retry";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, inArray } from "drizzle-orm";

export async function getAllPdfSubmissions() {
  return retry(() =>
    db.query.pdfSubmissions.findMany({
      with: {
        user: true,
        book: true,
        reviewer: true,
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submitted_at)],
    })
  );
}

export async function getPdfSubmissionsByFilters(filters: {
  userId?: string;
  status?: string;
}) {
  const whereConditions: any[] = [];
  if (filters.userId)
    whereConditions.push(eq(schema.pdfSubmissions.user_id, filters.userId));
  if (filters.status)
    whereConditions.push(eq(schema.pdfSubmissions.status, filters.status));

  return retry(() =>
    db.query.pdfSubmissions.findMany({
      where: and(...whereConditions),
      with: {
        user: {
          columns: { id: true, full_name: true, username: true, avatar_url: true },
        },
        book: {
          columns: { id: true, title: true, author: true, is_syllabus: true },
        },
        reviewer: {
          columns: { id: true, full_name: true },
        },
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submitted_at)],
    })
  );
}

export async function getPdfSubmissionsByUserId(userId: string) {
  return retry(() =>
    db.query.pdfSubmissions.findMany({
      where: eq(schema.pdfSubmissions.user_id, userId),
      with: {
        user: true,
        book: true,
        reviewer: true,
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submitted_at)],
    })
  );
}

export async function getDuplicatePdfSubmission(userId: string, bookId: string) {
  return retry(() =>
    db.query.pdfSubmissions.findFirst({
      where: and(
        eq(schema.pdfSubmissions.user_id, userId),
        ilike(schema.pdfSubmissions.book_id, bookId),
        inArray(schema.pdfSubmissions.status, ["pending", "approved"]),
      ),
    })
  );
}

export async function createPdfSubmission(
  submission: typeof schema.pdfSubmissions.$inferInsert,
) {
  return retry(() =>
    db.insert(schema.pdfSubmissions).values({
      ...submission,
      book_id: submission.book_id.toUpperCase(),
    })
  );
}

export async function updatePdfSubmission(
  id: string,
  updates: Partial<typeof schema.pdfSubmissions.$inferInsert>,
) {
  return retry(() =>
    db
      .update(schema.pdfSubmissions)
      .set(updates)
      .where(eq(schema.pdfSubmissions.id, id))
  );
}
