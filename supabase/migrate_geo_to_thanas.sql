-- =============================================================================
-- One-shot migration: divisions / districts / upazilas → flat `thanas` list
-- Run in Supabase SQL Editor on an existing project that used the old schema.
-- =============================================================================

-- 1) New thana list (no hierarchy)
create table if not exists public.thanas (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- 2) Profiles: add nullable thana, clear all members to NULL (re-pick in profile)
alter table public.profiles
  add column if not exists thana_id uuid references public.thanas(id) on delete set null;

update public.profiles set thana_id = null;

-- 3) Drop old geo FKs on profiles (constraint names match default Postgres naming)
alter table public.profiles drop constraint if exists profiles_division_id_fkey;
alter table public.profiles drop constraint if exists profiles_district_id_fkey;
alter table public.profiles drop constraint if exists profiles_upazila_id_fkey;

alter table public.profiles drop column if exists division_id;
alter table public.profiles drop column if exists district_id;
alter table public.profiles drop column if exists upazila_id;

-- 4) Drop RLS policies on old geo tables (only if those tables still exist)
do $$
begin
  if to_regclass('public.divisions') is not null then
    execute 'drop policy if exists "Public read divisions" on public.divisions';
  end if;
  if to_regclass('public.districts') is not null then
    execute 'drop policy if exists "Public read districts" on public.districts';
  end if;
  if to_regclass('public.upazilas') is not null then
    execute 'drop policy if exists "Public read upazilas" on public.upazilas';
    execute 'drop policy if exists "Admins manage upazilas insert" on public.upazilas';
    execute 'drop policy if exists "Admins manage upazilas update" on public.upazilas';
    execute 'drop policy if exists "Admins manage upazilas delete" on public.upazilas';
  end if;
end $$;

-- 5) Remove old tables (order: children first)
drop table if exists public.upazilas cascade;
drop table if exists public.districts cascade;
drop table if exists public.divisions cascade;

-- 6) RLS on `thanas`
alter table public.thanas enable row level security;

drop policy if exists "Public read thanas" on public.thanas;
drop policy if exists "Mods and admins insert thanas" on public.thanas;
drop policy if exists "Mods and admins update thanas" on public.thanas;
drop policy if exists "Mods and admins delete thanas" on public.thanas;

create policy "Public read thanas" on public.thanas for select using (true);

create policy "Mods and admins insert thanas" on public.thanas for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ));

create policy "Mods and admins update thanas" on public.thanas for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ));

create policy "Mods and admins delete thanas" on public.thanas for delete
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ));

-- 7) Sample thanas (skip if name already exists)
insert into public.thanas (name) values
  ('Akhalia Thana'),
  ('Zindabazar Thana'),
  ('Amberkhana Thana')
on conflict (name) do nothing;
