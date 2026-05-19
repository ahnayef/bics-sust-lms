import { CACHE_MODE } from "@/config";
import { cacheLife } from "next/cache";

/**
 * Call inside any "use cache" function instead of cacheLife() directly.
 * Respects the global CACHE_MODE from config.ts.
 *
 * @param profile - the default cacheLife profile to use when CACHE_MODE is "default"
 */
export function applyCacheLife(profile: "max" | "minutes" | "hours" | "days" | "weeks" | "seconds") {
  if (CACHE_MODE === "off") {
    cacheLife({ revalidate: 0, expire: 1 });
  } else if (typeof CACHE_MODE === "number") {
    cacheLife({ revalidate: CACHE_MODE, expire: CACHE_MODE * 2 });
  } else {
    cacheLife(profile);
  }
}
