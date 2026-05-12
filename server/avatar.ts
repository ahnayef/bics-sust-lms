
/**
 * Kept for backward compatibility.
 * Returns the remote URL directly. We rely on Next.js <Image> component
 * to optimize and cache the image via next/image instead of downloading it manually.
 */
export async function cacheAvatarLocally(
  userId: string,
  remoteUrl: string | null
): Promise<string | null> {
  // Return the remote URL directly. We will rely on Next.js <Image> component
  // to optimize and cache the image via next/image instead of downloading it manually.
  return remoteUrl;
}
