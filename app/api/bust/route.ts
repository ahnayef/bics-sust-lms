import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  revalidateTag("books", "max");
  revalidateTag("copies", "max");
  revalidateTag("transactions", "max");
  revalidateTag("overview", "max");
  revalidateTag("users", "max");
  return NextResponse.json({ success: true, message: "Cache busted!" });
}
