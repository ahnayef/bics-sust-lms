import { getBooks, getCopies } from "@/server/library";
import CopiesClient from "./CopiesClient";

export default async function CopiesPage() {
  const [copies, books] = await Promise.all([getCopies(), getBooks()]);
  return <CopiesClient initialCopies={copies} books={books} />;
}
