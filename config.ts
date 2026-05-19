/**
 * Global cache configuration.
 *
 * CACHE_MODE controls all "use cache" functions in the app:
 *   - "off"      → disables caching, every request hits the DB fresh
 *   - "default"  → uses the per-function cache profiles (max, minutes, etc.)
 *   - number     → overrides all cache lifetimes to this many seconds
 */
export const CACHE_MODE: "off" | "default" | number = "off";
