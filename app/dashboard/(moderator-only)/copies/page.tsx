import { getBooks, getCopies, getCategories } from "@/server/library";
import CopiesClient from "./CopiesClient";

export default async function CopiesPage() {
  const [copies, books, categories] = await Promise.all([getCopies(), getBooks(), getCategories()]);
  return <CopiesClient initialCopies={copies} books={books} categories={categories} />;
}
