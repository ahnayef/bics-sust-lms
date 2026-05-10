import { getBooks } from "@/server/library";
import BooksClient from "./BooksClient";

export default async function BooksPage() {
  const books = await getBooks();
  return <BooksClient initialBooks={books} />;
}
