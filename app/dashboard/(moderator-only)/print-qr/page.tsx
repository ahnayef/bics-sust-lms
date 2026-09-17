import PageTransition from "@/components/PageTransition";
import { getProfile } from "@/server/geo";
import { getBooks } from "@/server/library";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import PrintQrClient from "./PrintQrClient";

export default async function PrintQrPage() {
  const claims = await getClaims();
  if (!claims?.sub) {
    redirect("/login");
  }

  const profile = await getProfile(claims.sub);
  if (
    profile?.role !== "admin" &&
    profile?.role !== "superadmin" &&
    profile?.role !== "moderator"
  ) {
    redirect("/dashboard");
  }

  // Fetch books with copies using same function as Books page
  const books = await getBooks();

  // Extract copies array from books for PrintQrClient
  const copies = books.flatMap((book) =>
    (book.copies ?? []).map((copy) => ({
      id: copy.id,
      book_id: book.id,
      copy_number: copy.copy_number,
    })),
  );

  // Pass books in same shape as expected
  const simpleBooks = books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    is_syllabus: book.is_syllabus,
  }));

  return (
    <PageTransition>
      <PrintQrClient books={simpleBooks} copies={copies} />
    </PageTransition>
  );
}
