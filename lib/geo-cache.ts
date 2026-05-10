/**
 * lib/geo-cache.ts
 *
 * Reads the local geo-cache.json written by scripts/fetch-geo-cache.ts.
 * This file is only ever imported in server-side code.
 */

import type { Division, District, Upazila } from "@/types/profile";

interface GeoCache {
  fetchedAt: string | null;
  divisions: Division[];
  districts: District[];
  upazilas: Upazila[];
}

function loadCache(): GeoCache {
  try {
    // Dynamic require so Next.js doesn't try to bundle this at the edge
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("../data/geo-cache.json") as GeoCache;
    return raw;
  } catch {
    // File doesn't exist yet (first run before predev/prebuild)
    return { fetchedAt: null, divisions: [], districts: [], upazilas: [] };
  }
}

const cache = loadCache();

export const cachedDivisions: Division[] = cache.divisions;
export const cachedDistricts: District[] = cache.districts;
export const cachedUpazilas: Upazila[] = cache.upazilas;

/** True when the cache file is missing or was written with empty data */
export const isCacheEmpty: boolean =
  cache.divisions.length === 0 || cache.fetchedAt === null;

/** ISO timestamp of when the cache was last written, or null */
export const cacheTimestamp: string | null = cache.fetchedAt;
