/**
 * scripts/fetch-geo-cache.ts
 *
 * Fetches all Bangladesh geo data (divisions, districts, upazilas) from the
 * public bdapis.vercel.app API and writes it to data/geo-cache.json.
 *
 * Runs automatically before `dev` and `build` via package.json predev/prebuild.
 * You can also run it manually: bun scripts/fetch-geo-cache.ts
 *
 * If the API is unreachable and a cache file already exists, the existing
 * file is kept intact so the app continues to work offline.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const BDAPI = "https://bdapis.vercel.app/geo/v2.0";
const OUT_PATH = join(import.meta.dir, "../data/geo-cache.json");
const TIMEOUT_MS = 10_000;

interface BdDivision {
  id: string;
  name: string;
}

interface BdDistrict {
  id: string;
  division_id: string;
  name: string;
}

interface BdUpazila {
  id: string;
  district_id?: string;
  name: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const json = await res.json();
    return json;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log("📍 Fetching Bangladesh geo data…");

  // ── Divisions ──────────────────────────────────────────────────────────────
  let divisions: BdDivision[];
  try {
    const res = await fetchJson<{ data: BdDivision[] }>(`${BDAPI}/divisions`);
    divisions = res.data;
    console.log(`  ✓ ${divisions.length} divisions`);
  } catch (err) {
    handleOffline(err);
    return;
  }

  // ── Districts ──────────────────────────────────────────────────────────────
  let districts: BdDistrict[];
  try {
    const res = await fetchJson<{ data: BdDistrict[] }>(`${BDAPI}/districts`);
    districts = res.data;
    console.log(`  ✓ ${districts.length} districts`);
  } catch (err) {
    handleOffline(err);
    return;
  }

  // ── Upazilas ──────────────────────────────────────────────────────────────
  // Try the bulk endpoint first; fall back to per-district fetching.
  let upazilas: (BdUpazila & { district_id: string })[] = [];
  try {
    const res = await fetchJson<{ data: BdUpazila[] }>(`${BDAPI}/upazilas`);
    const bulk = res.data ?? [];
    if (bulk.length > 0 && bulk[0].district_id) {
      upazilas = bulk as (BdUpazila & { district_id: string })[];
      console.log(`  ✓ ${upazilas.length} upazilas (bulk)`);
    } else {
      throw new Error("bulk endpoint returned no district_id — falling back");
    }
  } catch {
    // Per-district fallback
    console.log("  ↩ bulk upazila endpoint unavailable, fetching per district…");
    for (const district of districts) {
      try {
        const res = await fetchJson<{ data: BdUpazila[] }>(
          `${BDAPI}/upazilas/${district.id}`,
        );
        const batch = (res.data ?? []).map((u) => ({
          ...u,
          district_id: district.id,
        }));
        upazilas.push(...batch);
      } catch {
        console.warn(`  ⚠ Could not fetch upazilas for district ${district.name}`);
      }
    }
    console.log(`  ✓ ${upazilas.length} upazilas (per-district)`);
  }

  if (upazilas.length === 0) {
    handleOffline(new Error("Received 0 upazilas"));
    return;
  }

  // ── Write cache file ───────────────────────────────────────────────────────
  mkdirSync(join(import.meta.dir, "../data"), { recursive: true });

  const cache = {
    fetchedAt: new Date().toISOString(),
    divisions: divisions.map((d) => ({ id: d.id, name: d.name })),
    districts: districts.map((d) => ({
      id: d.id,
      division_id: d.division_id,
      name: d.name,
    })),
    upazilas: upazilas.map((u) => ({
      id: u.id,
      district_id: u.district_id,
      name: u.name,
    })),
  };

  writeFileSync(OUT_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log(`  ✓ Written to data/geo-cache.json (${upazilas.length} upazilas)`);
}

function handleOffline(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (existsSync(OUT_PATH)) {
    const existing = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
    console.warn(`  ⚠ API unreachable (${msg}). Using existing cache from ${existing.fetchedAt}.`);
  } else {
    console.warn(`  ⚠ API unreachable (${msg}) and no existing cache found.`);
    console.warn("    The app will show an offline warning on the setup page.");
    // Write an empty-but-valid cache so the app knows it's offline
    mkdirSync(join(import.meta.dir, "../data"), { recursive: true });
    writeFileSync(
      OUT_PATH,
      JSON.stringify({ fetchedAt: null, divisions: [], districts: [], upazilas: [] }, null, 2),
      "utf-8",
    );
  }
}

main().catch((err) => {
  console.error("Unexpected error in fetch-geo-cache:", err);
  process.exit(0); // don't fail the build
});
