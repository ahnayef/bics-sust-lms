/**
 * server/telegram.ts — Utility for dispatching notifications to the Telegram channel
 * using the Telegram Bot API.
 */

export interface TelegramDispatchResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramNotification(
  messageHtml: string,
): Promise<TelegramDispatchResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.",
    );
    return {
      success: false,
      error: "Telegram configuration is missing on server.",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // Do not cache Telegram API requests
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      const errorMsg = data?.description || `HTTP ${res.status} error from Telegram API`;
      console.error("[Telegram] Failed to send message:", errorMsg);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: any) {
    console.error("[Telegram] Network exception:", err);
    return {
      success: false,
      error: err.message || "Network error sending Telegram notification.",
    };
  }
}
