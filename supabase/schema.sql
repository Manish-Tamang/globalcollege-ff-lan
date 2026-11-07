-- Global Free Fire LAN — Supabase schema.
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Security model
--   * The public never reads or writes tables directly. Registrations go
--     through /api/register, which uses the service-role key and calls
--     register_team(). Anyone may call team_name_available().
--   * Admins are auth users listed in public.admins. Row level security lets
--     only them read/update registrations and view payment screenshots.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------- tables

do $$ begin
  create type public.registration_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Single-row table for switches the dashboard can flip.
create table if not exists public.settings (
  id boolean primary key default true check (id),
  registration_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (true) on conflict do nothing;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  -- citext makes "Team Alpha" and "team alpha" the same name.
  team_name extensions.citext not null,
  -- Inter-college event: the college the whole squad represents.
  college text not null,
  status public.registration_status not null default 'pending',
  payment_screenshot_path text not null,
  transaction_id text,
  consent_statement text not null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_team_name_key unique (team_name),
  constraint teams_team_name_length check (char_length(team_name) between 2 and 32),
  constraint teams_college_length check (char_length(college) between 3 and 120)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  -- Player 1 is the team leader / captain.
  is_captain boolean generated always as (slot = 1) stored,
  real_name text not null,
  ign text not null,
  ff_uid text not null,
  grade text not null check (grade in ('11', '12')),
  -- Photo of the student ID card, in the private id-cards bucket.
  id_card_path text not null,
  whatsapp text not null,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint players_team_slot_key unique (team_id, slot),
  -- "Each player can represent only one team."
  constraint players_ff_uid_key unique (ff_uid)
);

create index if not exists players_team_id_idx on public.players (team_id);
create index if not exists teams_status_idx on public.teams (status);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists teams_touch on public.teams;
create trigger teams_touch before update on public.teams
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- helpers

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Lets the registration form say "team name already taken" without exposing
-- the teams table.
create or replace function public.team_name_available(p_name text)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  -- citext's case-insensitive "=" lives in the extensions schema.
  select not exists (
    select 1 from public.teams where team_name = trim(p_name)::citext
  );
$$;

-- Inserts a team and its four players in one transaction. Only the
-- service role (the /api/register route) may call it.
create or replace function public.register_team(p_team jsonb, p_players jsonb)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_team_id uuid;
begin
  if not (select registration_open from public.settings where id) then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_players) <> 4 then
    raise exception 'team_must_have_four_players' using errcode = 'P0001';
  end if;

  insert into public.teams (team_name, college, payment_screenshot_path, transaction_id, consent_statement)
  values (
    trim(p_team ->> 'team_name'),
    trim(p_team ->> 'college'),
    p_team ->> 'payment_screenshot_path',
    nullif(trim(p_team ->> 'transaction_id'), ''),
    p_team ->> 'consent_statement'
  )
  returning id into v_team_id;

  insert into public.players (team_id, slot, real_name, ign, ff_uid, grade, id_card_path, whatsapp)
  select v_team_id, p.slot, trim(p.real_name), trim(p.ign), trim(p.ff_uid), p.grade,
         p.id_card_path, trim(p.whatsapp)
  from jsonb_to_recordset(p_players) as p(
    slot smallint, real_name text, ign text, ff_uid text, grade text,
    id_card_path text, whatsapp text
  );

  return v_team_id;
end $$;

revoke all on function public.register_team(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.register_team(jsonb, jsonb) to service_role;
grant execute on function public.team_name_available(text) to anon, authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "settings readable" on public.settings;
create policy "settings readable" on public.settings
  for select to anon, authenticated using (true);

drop policy if exists "settings admin update" on public.settings;
create policy "settings admin update" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "teams admin read" on public.teams;
create policy "teams admin read" on public.teams
  for select to authenticated using (public.is_admin());

drop policy if exists "teams admin update" on public.teams;
create policy "teams admin update" on public.teams
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "teams admin delete" on public.teams;
create policy "teams admin delete" on public.teams
  for delete to authenticated using (public.is_admin());

drop policy if exists "players admin read" on public.players;
create policy "players admin read" on public.players
  for select to authenticated using (public.is_admin());

drop policy if exists "players admin update" on public.players;
create policy "players admin update" on public.players
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "payment proofs admin read" on storage.objects;
create policy "payment proofs admin read" on storage.objects
  for select to authenticated using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "payment proofs admin delete" on storage.objects;
create policy "payment proofs admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'payment-proofs' and public.is_admin());

-- Student ID card photos: private, admins only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-cards', 'id-cards', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "id cards admin read" on storage.objects;
create policy "id cards admin read" on storage.objects
  for select to authenticated using (bucket_id = 'id-cards' and public.is_admin());

drop policy if exists "id cards admin delete" on storage.objects;
create policy "id cards admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'id-cards' and public.is_admin());

-- ---------------------------------------------------------------- first admin
-- 1. Supabase → Authentication → Users → "Add user" (email + password,
--    tick "Auto confirm").
-- 2. Then run, with that email:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
