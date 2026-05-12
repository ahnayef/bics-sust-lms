import fs from "fs/promises";
import path from "path";

/**
 * Downloads an avatar from a remote URL and saves it locally to avoid 429 errors from Google.
 * Returns the local URL path (e.g. /avatars/{userId}.jpg) if successful, otherwise returns the original URL.
 */
export async function cacheAvatarLocally(
  userId: string,
  remoteUrl: string | null
): Promise<string | null> {
  if (!remoteUrl) return null;

  // If it's already a local path, don't download it again
  if (remoteUrl.startsWith("/avatars/")) return remoteUrl;

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      console.error(`Failed to fetch avatar for ${userId}: ${response.statusText}`);
      return remoteUrl; // fallback to remote
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure the avatars directory exists
    const avatarsDir = path.join(process.cwd(), "public", "avatars");
    await fs.mkdir(avatarsDir, { recursive: true });

    // We'll save it as jpg by default, as Google avatars are usually JPEG
    const fileName = `${userId}.jpg`;
    const filePath = path.join(avatarsDir, fileName);

    await fs.writeFile(filePath, buffer);

    return `/avatars/${fileName}`;
  } catch (error) {
    console.error(`Error caching avatar for ${userId}:`, error);
    return remoteUrl; // fallback to remote if error occurs
  }
}
