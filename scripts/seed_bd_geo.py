#!/usr/bin/env python3
"""
Seed Bangladesh geo data (divisions, districts, upazilas) into Supabase.

=== SETUP ===

  pip install requests

  Then export your Supabase credentials as environment variables:

    export SUPABASE_URL="https://your-project.supabase.co"
    export SUPABASE_SERVICE_KEY="your-service-role-key"

  Where to find these:
    - SUPABASE_URL    → Supabase Dashboard → Project Settings → API → Project URL
    - SUPABASE_SERVICE_KEY → Supabase Dashboard → Project Settings → API → service_role (secret)

  ⚠  Use the SERVICE ROLE key, NOT the anon/public key.
     The service role key bypasses Row Level Security (RLS), which is intentional
     here so the seeder can write directly without a logged-in user session.
     NEVER commit this key to git or expose it to the browser.

=== USAGE ===

  python scripts/seed_bd_geo.py

=== WHAT IT DOES ===

  Fetches all 8 divisions, 64 districts, and ~495 upazilas from the public
  bdapis.vercel.app API and upserts them into your Supabase tables:
    - public.divisions   (id, name)
    - public.districts   (id, division_id, name)
    - public.upazilas    (id, district_id, name)

  "Upsert" means re-running this script is safe — existing rows are updated
  rather than duplicated (uses Supabase's `resolution=merge-duplicates` header).

=== AFTER SEEDING ===

  You can verify in Supabase → Table Editor, or via the SQL editor:

    select count(*) from divisions;   -- should be 8
    select count(*) from districts;   -- should be 64
    select count(*) from upazilas;    -- should be ~495

  To make yourself an admin (replace with your email):
    update public.profiles
    set role = 'admin'
    where email = 'you@example.com';
"""

import os
import sys
import time

import requests

# ---------------------------------------------------------------------------
# Source API — all endpoints are public, no key required
# ---------------------------------------------------------------------------
BDAPI = "https://bdapis.vercel.app/geo/v2.0"


def supabase_post(base_url: str, table: str, payload: list, headers: dict) -> None:
    """POST (upsert) a batch of rows into a Supabase table and print the result."""
    r = requests.post(f"{base_url}/rest/v1/{table}", json=payload, headers=headers)
    if r.status_code in (200, 201):
        print(f"  ✓ {table}: {len(payload)} rows → HTTP {r.status_code}")
    else:
        print(f"  ✗ {table}: HTTP {r.status_code}")
        print(f"    {r.text[:400]}")


def main() -> None:
    # -------------------------------------------------------------------------
    # 1. Read credentials from environment
    # -------------------------------------------------------------------------
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not service_key:
        print("ERROR: Required environment variables are not set.")
        print()
        print("  export SUPABASE_URL='https://your-project.supabase.co'")
        print("  export SUPABASE_SERVICE_KEY='your-service-role-key'")
        print()
        print("  Find the service_role key at:")
        print("  Supabase Dashboard → Project Settings → API → service_role (secret)")
        print()
        print("  ⚠  Do NOT use the anon/public key — it won't have write access.")
        sys.exit(1)

    # Supabase REST headers — service role key grants full access bypassing RLS
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # merge-duplicates = upsert: safe to re-run without creating duplicates
        "Prefer": "resolution=merge-duplicates",
    }

    # -------------------------------------------------------------------------
    # 2. Fetch all geo data from bdapis
    # -------------------------------------------------------------------------
    print("─" * 50)
    print("Fetching data from bdapis.vercel.app …")
    print("─" * 50)

    print("  Divisions …")
    divisions_resp = requests.get(f"{BDAPI}/divisions", timeout=15)
    divisions_resp.raise_for_status()
    divisions = divisions_resp.json().get("data", [])
    print(f"  → {len(divisions)} divisions")

    print("  Districts …")
    districts_resp = requests.get(f"{BDAPI}/districts", timeout=15)
    districts_resp.raise_for_status()
    districts = districts_resp.json().get("data", [])
    print(f"  → {len(districts)} districts")

    print("  Upazilas … (may take a moment)")
    upazilas_resp = requests.get(f"{BDAPI}/upazilas", timeout=30)
    upazilas_resp.raise_for_status()
    upazilas_raw = upazilas_resp.json().get("data", [])

    if upazilas_raw:
        # The /upazilas endpoint returned a full list — great
        print(f"  → {len(upazilas_raw)} upazilas (fetched in one call)")
    else:
        # Fallback: fetch per district (slower but reliable)
        print("  Full upazila list unavailable — fetching per district …")
        upazilas_raw = []
        for district in districts:
            time.sleep(0.15)  # be polite to the free API
            r = requests.get(f"{BDAPI}/upazilas/{district['id']}", timeout=15)
            if r.status_code != 200:
                print(
                    f"    ⚠  district {district['name']}: HTTP {r.status_code}, skipping"
                )
                continue
            batch = r.json().get("data", [])
            # Attach district_id since per-district endpoint may omit it
            for u in batch:
                u.setdefault("district_id", district["id"])
            upazilas_raw.extend(batch)
            print(f"    district {district['name']}: {len(batch)} upazilas")
        print(f"  → {len(upazilas_raw)} upazilas total")

    # -------------------------------------------------------------------------
    # 3. Normalise payloads
    # -------------------------------------------------------------------------

    # Divisions: { id, name }
    division_payload = [
        {"id": str(d["id"]), "name": d["name"]}
        for d in divisions
        if d.get("id") and d.get("name")
    ]

    # Districts: { id, division_id, name }
    district_payload = [
        {
            "id": str(d["id"]),
            "division_id": str(d["division_id"]),
            "name": d["name"],
        }
        for d in districts
        if d.get("id") and d.get("division_id") and d.get("name")
    ]

    # Upazilas: { id, district_id, name }
    # Only include rows where we can resolve the district_id
    upazila_payload = [
        {
            "id": str(u["id"]),
            "district_id": str(u["district_id"]),
            "name": u["name"],
        }
        for u in upazilas_raw
        if u.get("id") and u.get("district_id") and u.get("name")
    ]

    print()
    print(
        f"  Normalised: {len(division_payload)} divisions, "
        f"{len(district_payload)} districts, "
        f"{len(upazila_payload)} upazilas"
    )

    # -------------------------------------------------------------------------
    # 4. Insert (upsert) into Supabase
    # -------------------------------------------------------------------------
    print()
    print("─" * 50)
    print("Inserting into Supabase …")
    print("─" * 50)

    supabase_post(supabase_url, "divisions", division_payload, headers)
    supabase_post(supabase_url, "districts", district_payload, headers)

    # Upazilas can be large — insert in batches to stay within request limits
    BATCH_SIZE = 200
    total_batches = (len(upazila_payload) + BATCH_SIZE - 1) // BATCH_SIZE
    for i in range(0, len(upazila_payload), BATCH_SIZE):
        batch = upazila_payload[i : i + BATCH_SIZE]
        batch_no = i // BATCH_SIZE + 1
        r = requests.post(
            f"{supabase_url}/rest/v1/upazilas",
            json=batch,
            headers=headers,
            timeout=30,
        )
        status = "✓" if r.status_code in (200, 201) else "✗"
        print(
            f"  {status} upazilas batch {batch_no}/{total_batches}: "
            f"{len(batch)} rows → HTTP {r.status_code}"
        )
        if r.status_code not in (200, 201):
            print(f"    {r.text[:400]}")

    # -------------------------------------------------------------------------
    # 5. Done
    # -------------------------------------------------------------------------
    print()
    print("─" * 50)
    print("Done! All geo data seeded.")
    print("─" * 50)
    print()
    print("Verify in SQL Editor:")
    print("  select count(*) from divisions;  -- expect 8")
    print("  select count(*) from districts;  -- expect 64")
    print("  select count(*) from upazilas;   -- expect ~495")
    print()
    print("To grant yourself admin access:")
    print("  update public.profiles")
    print("    set role = 'admin'")
    print("    where email = 'you@example.com';")


if __name__ == "__main__":
    main()
