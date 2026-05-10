-- ============================================================
-- BICS SUST LMS — Complete Database Schema
-- Run this file once on a fresh Supabase project.
-- For existing databases, use the migration commands at the bottom.
-- ============================================================

-- ============================================================
-- Bangladesh Administrative Hierarchy
-- ============================================================

create table if not exists public.divisions (
  id   text primary key,  -- e.g. "1", "2" from bdapis
  name text not null unique
);

create table if not exists public.districts (
  id          text primary key,
  division_id text not null references public.divisions(id) on delete cascade,
  name        text not null
);

create table if not exists public.upazilas (
  id          text primary key,
  district_id text not null references public.districts(id) on delete cascade,
  name        text not null
);

-- Seed: 8 divisions
insert into public.divisions (id, name) values
  ('1','Chattagram'), ('2','Rajshahi'), ('3','Khulna'),
  ('4','Barisal'), ('5','Sylhet'), ('6','Dhaka'),
  ('7','Rangpur'), ('8','Mymensingh')
on conflict (id) do nothing;

-- Districts and upazilas are NOT seeded here.
-- Run: bun fetch-geo   (scripts/fetch-geo-cache.ts)
-- to populate all 64 districts + ~495 upazilas from bdapis.vercel.app.

-- ============================================================
-- Profiles
-- ============================================================

create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text not null unique,
  full_name         text not null,
  email             text not null,
  phone             text,
  avatar_url        text,
  rank              text not null default 'None'
                      check (rank in ('None','Member','Associate','Supporter')),
  division_id       text references public.divisions(id),
  district_id       text references public.districts(id),
  upazila_id        text references public.upazilas(id),
  role              text not null default 'member'
                      check (role in ('member','moderator','admin')),
  is_verified          boolean not null default false,
  profile_completed     boolean not null default false,
  hide_sensitive_info   boolean not null default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- Books
-- ============================================================

create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text not null,
  is_syllabus boolean not null default false,
  pages       integer,
  pdf_link    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- Copies  (physical copies of a book; id = QR code text)
-- ============================================================

create table if not exists public.copies (
  id          text primary key,   -- e.g. "QR001" — printed on the QR card
  book_id     uuid not null references public.books(id) on delete cascade,
  copy_number integer not null default 1,
  status      text not null default 'available'
                check (status in ('available', 'borrowed', 'damaged')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- Transactions  (borrow requests, active borrows, return requests)
--
-- Lifecycle:
--   borrowBook()         → type=borrow,  status=pending
--   allowBorrowRequest() → status=active,   copy.status=borrowed
--   rejectBorrowRequest()→ status=rejected
--   returnBook()         → type=return,  status=pending
--   approveReturnRequest()→ both=completed, copy.status=available
--   rejectReturnRequest()→ return=rejected
-- ============================================================

create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  copy_id          text not null references public.copies(id) on delete cascade,
  book_id          uuid not null references public.books(id) on delete cascade,
  type             text not null check (type in ('borrow', 'return')),
  status           text not null default 'pending'
                     check (status in ('pending','active','overdue','completed','rejected')),
  request_date     timestamptz default now(),
  approved_date    timestamptz,
  due_date         date,
  return_date      timestamptz,
  rejection_reason text,
  reviewed_by      uuid references public.profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- PDF Submissions  (self-reported reading via PDF)
-- ============================================================

create table if not exists public.pdf_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  book_id          uuid not null references public.books(id) on delete cascade,
  read_date        date,
  note             text,
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected')),
  submitted_at     timestamptz default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles(id),
  rejection_reason text
);

-- ============================================================
-- Settings  (global app configuration — key/value store)
-- ============================================================

create table if not exists public.settings (
  key   text primary key,
  value text not null
);

insert into public.settings (key, value) values
  ('syllabus_total', '80')   -- configurable target number of syllabus books
on conflict (key) do nothing;

-- ============================================================
-- updated_at trigger function
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger books_updated_at
  before update on public.books
  for each row execute function public.handle_updated_at();

create trigger copies_updated_at
  before update on public.copies
  for each row execute function public.handle_updated_at();

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.divisions     enable row level security;
alter table public.districts     enable row level security;
alter table public.upazilas      enable row level security;
alter table public.profiles      enable row level security;
alter table public.books         enable row level security;
alter table public.copies        enable row level security;
alter table public.transactions  enable row level security;
alter table public.pdf_submissions enable row level security;
alter table public.settings      enable row level security;

-- ── Geo: public read ────────────────────────────────────────────────────────
create policy "Public read divisions" on public.divisions for select using (true);
create policy "Public read districts" on public.districts for select using (true);
create policy "Public read upazilas"  on public.upazilas  for select using (true);

-- Upazilas: admins can insert/update/delete
create policy "Admins manage upazilas insert" on public.upazilas for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage upazilas update" on public.upazilas for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage upazilas delete" on public.upazilas for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ── Profiles ────────────────────────────────────────────────────────────────
-- NOTE: Never query the profiles table inside a profiles RLS policy —
-- that causes infinite recursion. Use auth.jwt() or auth.uid() = id only.

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Admins & mods can read all profiles (role read from JWT — requires Custom JWT Hook)
-- See: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control
create policy "Admins and moderators view all profiles"
  on public.profiles for select
  using (auth.uid() = id or (auth.jwt() ->> 'role') in ('admin','moderator'));

-- Any signed-in user can view any profile (needed for /profile/{username})
create policy "Authenticated users can view any profile"
  on public.profiles for select using (auth.uid() is not null);

-- ── Books ───────────────────────────────────────────────────────────────────
create policy "Authenticated users read books"
  on public.books for select using (auth.uid() is not null);

create policy "Mods and admins insert books"
  on public.books for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

create policy "Mods and admins update books"
  on public.books for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

create policy "Mods and admins delete books"
  on public.books for delete
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

-- ── Copies ──────────────────────────────────────────────────────────────────
create policy "Authenticated users read copies"
  on public.copies for select using (auth.uid() is not null);

create policy "Mods and admins insert copies"
  on public.copies for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

create policy "Mods and admins update copies"
  on public.copies for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

create policy "Mods and admins delete copies"
  on public.copies for delete
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

-- ── Transactions ─────────────────────────────────────────────────────────────
create policy "Users see own transactions, mods see all"
  on public.transactions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','moderator')
    )
  );

create policy "Users create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Mods and admins update transactions"
  on public.transactions for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

-- ── PDF Submissions ──────────────────────────────────────────────────────────
create policy "Users see own submissions, mods see all"
  on public.pdf_submissions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','moderator')
    )
  );

create policy "Users insert own submissions"
  on public.pdf_submissions for insert
  with check (auth.uid() = user_id);

create policy "Mods and admins update submissions"
  on public.pdf_submissions for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','moderator')
  ));

-- ── Settings ─────────────────────────────────────────────────────────────────
create policy "Authenticated users read settings"
  on public.settings for select using (auth.uid() is not null);

create policy "Admins update settings"
  on public.settings for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins insert settings"
  on public.settings for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- Admin setup
-- After signing up and completing your profile, run:
--   update public.profiles set role = 'admin' where email = 'your@email.com';
-- ============================================================

-- ============================================================
-- MIGRATIONS (run these if upgrading an existing database)
-- ============================================================
-- alter table public.profiles add column if not exists avatar_url text;
-- create table if not exists public.books ( ... );   -- see above
-- create table if not exists public.copies ( ... );
-- create table if not exists public.transactions ( ... );
-- create table if not exists public.pdf_submissions ( ... );
-- create table if not exists public.settings ( ... );
-- insert into public.settings values ('syllabus_total','80') on conflict do nothing;
