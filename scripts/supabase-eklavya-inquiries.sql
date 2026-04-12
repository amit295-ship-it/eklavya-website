-- =============================================================================
-- Eklavya website contact form → Supabase
-- Dashboard → SQL Editor → paste → Run once on your Eklavya (or chosen) project.
-- =============================================================================

create table if not exists public.eklavya_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  program_interest text,
  message text
);

comment on table public.eklavya_inquiries is 'Contact / interest submissions from eklavya-website';

alter table public.eklavya_inquiries enable row level security;

drop policy if exists "Allow anonymous insert on eklavya_inquiries" on public.eklavya_inquiries;

-- Public form: allow inserts from the anon API key only (RLS still applies).
create policy "Allow anonymous insert on eklavya_inquiries"
  on public.eklavya_inquiries
  for insert
  to anon
  with check (true);

grant usage on schema public to anon;
grant insert on table public.eklavya_inquiries to anon;

-- Optional: allow authenticated dashboard users to read (service role bypasses RLS).
-- create policy "Authenticated read eklavya_inquiries"
--   on public.eklavya_inquiries for select to authenticated using (true);
-- grant select on table public.eklavya_inquiries to authenticated;
