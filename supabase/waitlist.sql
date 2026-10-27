-- DropLates waitlist table (Supabase / Postgres).
-- Run once in: Supabase dashboard → SQL Editor → New query → Run.

create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null check (char_length(email) between 3 and 254),
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

-- One row per address, ignoring capitals (Ann@x.com and ann@x.com are the same person).
create unique index if not exists waitlist_email_lower_key on public.waitlist (lower(email));

-- Row-level security: anyone may add an address, nobody on the public web may read the list.
alter table public.waitlist enable row level security;

drop policy if exists "Anyone can join the waitlist" on public.waitlist;
create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- No select policy on purpose. Read or export subscribers from the Supabase dashboard.
