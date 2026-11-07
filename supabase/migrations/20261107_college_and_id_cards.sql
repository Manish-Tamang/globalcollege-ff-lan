-- Run this ONCE in Supabase → SQL Editor if you already ran schema.sql
-- before 2026-11-07. (Fresh projects: just run schema.sql instead.)
--
-- Changes:
--   * teams get a free-text `college` (inter-college event)
--   * players lose `body` (GCM/GSS/A-Levels) and `id_card_number`
--   * players get `id_card_path`: a photo of the ID card in the new
--     private `id-cards` bucket
--
-- Existing test registrations can't satisfy the new NOT NULL columns, so
-- they are deleted first. Their payment screenshots stay in the bucket;
-- delete them from Storage → payment-proofs if you want them gone.

begin;

delete from public.teams;  -- players go with them (on delete cascade)

-- teams.college
alter table public.teams add column if not exists college text not null;
alter table public.teams drop constraint if exists teams_college_length;
alter table public.teams
  add constraint teams_college_length check (char_length(college) between 3 and 120);

-- players: institution and ID number out, ID card photo in
alter table public.players drop constraint if exists players_id_card_key;
alter table public.players drop column if exists body;
alter table public.players drop column if exists id_card_number;
alter table public.players add column if not exists id_card_path text not null;

-- register_team() with the new fields
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

-- Private bucket for ID card photos, readable/deletable by admins only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-cards', 'id-cards', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "id cards admin read" on storage.objects;
create policy "id cards admin read" on storage.objects
  for select to authenticated using (bucket_id = 'id-cards' and public.is_admin());

drop policy if exists "id cards admin delete" on storage.objects;
create policy "id cards admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'id-cards' and public.is_admin());

commit;
