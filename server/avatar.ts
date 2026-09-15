
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Downloads a remote avatar and stores it in Supabase Storage.
 * This "hard caches" the image so we don't rely on external URLs
 * and improves LCP/performance.
 */
export async function cacheAvatarLocally(
  userId: string,
  remoteUrl: string | null
): Promise<string | null> {
  if (!remoteUrl) return null;

  // If it's already a local storage URL, don't re-cache
  if (remoteUrl.includes(".supabase.co/storage/v1/object/public/avatars/")) {
    return remoteUrl;
  }

  try {
    const supabase = await createServiceClient();

    // 1. Fetch the image
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error("Failed to fetch remote avatar");
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const fileName = `${userId}.${extension}`;

    // 2. Upload to 'avatars' bucket
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      // If bucket doesn't exist, we'll log it and return remoteUrl for now
      console.warn("Avatar cache failed (check if 'avatars' bucket exists):", error.message);
      return remoteUrl;
    }

    // 3. Return the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("Avatar caching error:", err);
    return remoteUrl;
  }
}
