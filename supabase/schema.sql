-- ============================================================
-- SUST LMS — Complete Database Schema
-- Run this file once on a fresh Supabase project.
-- For existing databases, use the migration commands at the bottom.
-- ============================================================

-- ============================================================
-- Thanas (flat list for member location — managed in dashboard)
-- ============================================================

create table if not exists public.thanas (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Sample rows for local/dev (optional; production may start empty)
insert into public.thanas (name) values
  ('Akhalia Thana'),
  ('Zindabazar Thana'),
  ('Amberkhana Thana')
on conflict (name) do nothing;

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
  thana_id          uuid references public.thanas(id) on delete set null,
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
  short_id    text not null unique default substr(md5(random()::text), 1, 6),
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
-- Action Logs (User verifications, role changes, system events)
-- ============================================================

create table if not exists public.action_logs (
  id          uuid primary key default gen_random_uuid(),
  action_type text not null,
  actor_id    uuid references public.profiles(id) on delete set null,
  target_id   uuid references public.profiles(id) on delete cascade,
  details     text,
  created_at  timestamptz default now()
);

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

alter table public.thanas        enable row level security;
alter table public.profiles      enable row level security;
alter table public.books         enable row level security;
alter table public.copies        enable row level security;
alter table public.transactions  enable row level security;
alter table public.pdf_submissions enable row level security;
alter table public.settings      enable row level security;
alter table public.action_logs   enable row level security;

-- ── Thanas: public read; mods/admins manage ─────────────────────────────────
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

-- ── Action Logs ─────────────────────────────────────────────────────────────
create policy "Users read own target action logs"
  on public.action_logs for select
  using (target_id = auth.uid() or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ));

create policy "Mods and admins insert action logs"
  on public.action_logs for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ));

-- ============================================================
-- Admin setup
-- After signing up and completing your profile, run:
--   update public.profiles set role = 'admin' where email = 'your@email.com';
-- ============================================================

-- ============================================================
-- MIGRATIONS (run these if upgrading an existing database)
-- ============================================================
-- alter table public.profiles add column if not exists avatar_url text;
-- alter table public.books add column if not exists short_id text not null unique default substr(md5(random()::text), 1, 6);
-- create table if not exists public.books ( ... );   -- see above
-- create table if not exists public.copies ( ... );
-- create table if not exists public.transactions ( ... );
-- create table if not exists public.pdf_submissions ( ... );
-- create table if not exists public.settings ( ... );
-- insert into public.settings values ('syllabus_total','80') on conflict do nothing;

-- ============================================================
-- Performance indexes
-- ============================================================

create index if not exists idx_transactions_status
  on public.transactions(status);

create index if not exists idx_transactions_type_status
  on public.transactions(type, status);

create index if not exists idx_transactions_user_id_status
  on public.transactions(user_id, status);

create index if not exists idx_transactions_due_date
  on public.transactions(due_date)
  where due_date is not null;

create index if not exists idx_transactions_request_date
  on public.transactions(request_date desc);

create index if not exists idx_pdf_submissions_status
  on public.pdf_submissions(status);

create index if not exists idx_books_is_syllabus
  on public.books(is_syllabus);

create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_profiles_thana_id
  on public.profiles(thana_id)
  where thana_id is not null;

-- ============================================================
-- Additional settings
-- ============================================================

insert into public.settings (key, value) values
  ('loan_period_days',       '14'),   -- default loan window in days
  ('fine_per_day_bdt',       '5'),    -- overdue fine per day (BDT)
  ('max_borrows_per_member', '3')     -- max concurrent borrows per member
on conflict (key) do nothing;

-- ============================================================
-- mark_overdue_transactions() function
--
-- Updates any active borrow whose due_date has passed to 'overdue'.
-- Called automatically by the overview page on each load.
-- Can also be scheduled via pg_cron for real-time accuracy.
-- ============================================================

create or replace function public.mark_overdue_transactions()
returns integer
language plpgsql
security definer
as $$
declare
  affected integer;
begin
  update public.transactions
  set
    status     = 'overdue',
    updated_at = now()
  where
    type     = 'borrow'
    and status   = 'active'
    and due_date is not null
    and due_date < current_date;

  get diagnostics affected = row_count;
  return affected;
end;
$$;


-- Allow admins and moderators to update any profile
create policy "Admins and mods can update any profile"
  on public.profiles for update
  using (
    (auth.jwt() ->> 'role') in ('admin', 'moderator')
  );
