import { updateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  updateTag("books");
  updateTag("copies");
  updateTag("transactions");
  updateTag("overview");
  updateTag("users");
  return NextResponse.json({ success: true, message: "Cache busted!" });
}
