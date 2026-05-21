import { getBooks, getCategories } from "@/server/library";
import BooksClient from "./BooksClient";

export default async function BooksPage() {
  const [books, categories] = await Promise.all([
    getBooks(),
    getCategories(),
  ]);
  return <BooksClient initialBooks={books} categories={categories} />;
}
