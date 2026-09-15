"use server";

/**
 * server/delivery-actions.ts — Server action for processing home delivery requests
 * and notifying the Telegram channel.
 */

import { insertActionLog } from "@/lib/db/queries/actionLogs";
import { getBooksByIds } from "@/lib/db/queries/books";
import { getThanaById } from "@/lib/db/queries/geo";
import { getProfile } from "@/server/geo";
import {
  escapeTelegramHtml,
  sendTelegramNotification,
} from "@/server/telegram";
import { getClaims } from "@/server/user";
import { revalidatePath } from "next/cache";

export interface DeliverySubmissionResult {
  success: boolean;
  count?: number;
  error?: string;
  telegramSent?: boolean;
}

export async function submitHomeDeliveryRequest(
  formData: FormData,
): Promise<DeliverySubmissionResult> {
  const claims = await getClaims();
  if (!claims) {
    return {
      success: false,
      error: "You must be signed in to request home delivery.",
    };
  }

  const userId = claims.sub;
  const profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: "Member profile could not be retrieved." };
  }

  const rawBookIds = formData.get("book_ids") as string;
  let bookIds: string[] = [];
  try {
    bookIds = JSON.parse(rawBookIds);
  } catch {
    const singleBookId = formData.get("book_id") as string;
    if (singleBookId) {
      bookIds = [singleBookId];
    }
  }

  if (!bookIds || bookIds.length === 0) {
    return {
      success: false,
      error: "Please select at least one book to request.",
    };
  }

  const phone = (
    (formData.get("phone") as string) ||
    profile.phone ||
    ""
  ).trim();
  if (!phone) {
    return {
      success: false,
      error: "A contact phone number is required for delivery coordination.",
    };
  }

  const address = ((formData.get("address") as string) || "").trim();
  if (!address) {
    return {
      success: false,
      error: "A delivery address (e.g. Hall/Room, Home address) is required.",
    };
  }

  const thanaId = (
    (formData.get("thana_id") as string) ||
    profile.thana_id ||
    ""
  ).trim();
  let thanaName = profile.thana?.name || "Unspecified";
  if (thanaId && thanaId !== profile.thana_id) {
    const th = await getThanaById(thanaId);
    if (th) thanaName = th.name;
  }

  const note = ((formData.get("note") as string) || "").trim();

  // Retrieve book titles and authors from database
  const requestedBooks = await getBooksByIds(bookIds);
  if (requestedBooks.length === 0) {
    return {
      success: false,
      error: "Selected books were not found in the library catalog.",
    };
  }

  // Format request timestamp in Bangladesh time
  const now = new Date();
  const timeFormatted = now.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Construct Telegram HTML message
  const memberNameEscaped = escapeTelegramHtml(profile.full_name);
  const usernameEscaped = escapeTelegramHtml(profile.username);
  const phoneEscaped = escapeTelegramHtml(phone);
  const addressEscaped = escapeTelegramHtml(address);
  const thanaEscaped = escapeTelegramHtml(thanaName);
  const noteEscaped = note ? escapeTelegramHtml(note) : "";

  const booksListHtml = requestedBooks
    .map((b, index) => {
      const titleEsc = escapeTelegramHtml(b.title);
      const authorEsc = escapeTelegramHtml(b.author);
      return `${index + 1}. <b>${titleEsc}</b>\n    <i>${authorEsc}</i>`;
    })
    .join("\n");

  const messageHtml = [
    `<b>নতুন হোম ডেলিভারি অনুরোধ (Home Delivery Request)</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `<b>Member:</b> ${memberNameEscaped} (@${usernameEscaped})`,
    `<b>Phone:</b> <a href="tel:${phoneEscaped}">${phoneEscaped}</a>`,
    `<b>Address:</b> ${addressEscaped}`,
    `<b>Thana:</b> ${thanaEscaped}`,
    `<b>Time:</b> ${timeFormatted} (BD Time)`,
    ``,
    `<b>অনুরোধকৃত বইসমূহ (${requestedBooks.length} টি):</b>`,
    booksListHtml,
    noteEscaped ? `\n<b>Note:</b>\n<i>${noteEscaped}</i>` : "",
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `<a href="https://pathagar-sust.vercel.app/dashboard/users/${userId}">সদস্য প্রোফাইল দেখুন</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  // Send to Telegram Channel via Bot API
  const telegramRes = await sendTelegramNotification(messageHtml);

  // Log to actionLogs
  try {
    await insertActionLog({
      action_type: "home_delivery_request",
      actor_id: userId,
      target_id: userId,
      details: JSON.stringify({
        book_count: requestedBooks.length,
        book_ids: bookIds,
        books: requestedBooks.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
        })),
        phone,
        address,
        thana: thanaName,
        note,
        telegram_sent: telegramRes.success,
        telegram_error: telegramRes.error || null,
      }),
    });
  } catch (logErr) {
    console.error("[Delivery] Failed to record action log:", logErr);
  }

  revalidatePath("/dashboard/home-delivery");

  return {
    success: true,
    count: requestedBooks.length,
    telegramSent: telegramRes.success,
  };
}
