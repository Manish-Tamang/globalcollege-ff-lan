# Global Free Fire LAN

Landing page, team registration and admin dashboard for the GSS-IT Club's
Free Fire LAN tournament at Global School of Science.

Next.js 16 (App Router) · Tailwind 3 · Supabase. The UI follows the Alfsight
system (Geist, neutral text, glossy buttons, dotted frame) with Global College
royal blue `#1346a0` as the one brand colour. Tokens live in `app/globals.css`.

## Routes

| Route          | What it is                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| `/`            | Landing: hero, stages, points, tie-breakers, eligibility, rules, how-to     |
| `/register`    | 4-step form: team name → 4 players → rules + consent (×4) → payment upload  |
| `/admin/login` | Email + password sign-in for organisers                                     |
| `/admin`       | Dashboard, wrapped in the `withAdminAuth` HOC                               |

## Setup

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It
   creates the tables, row level security, the `payment-proofs` storage
   bucket and the RPCs.
3. Create your admin: **Authentication → Users → Add user** (tick *Auto
   confirm*), then run:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

4. Copy `.env.example` to `.env.local` and fill in the three keys from
   **Project settings → API**.
5. `pnpm install && pnpm dev`

## Still to fill in

All in [`app/data/event.ts`](app/data/event.ts):

- `startDate` / `dateLabel`: the tournament date.
- `contactEmail`: currently the college's general inbox.

## Updating an existing database

If you ran `schema.sql` before 2026-11-07, run
[`supabase/migrations/20261107_college_and_id_cards.sql`](supabase/migrations/20261107_college_and_id_cards.sql)
once. It deletes existing test registrations, adds `teams.college`, swaps the
ID card number for an ID card photo and creates the `id-cards` bucket.

## How access is locked

- **UI gate**: `withAdminAuth` ([`app/lib/auth/with-admin-auth.tsx`](app/lib/auth/with-admin-auth.tsx))
  verifies the session with Supabase and checks the user is in `public.admins`.
  Anyone else is redirected to `/admin/login` before the dashboard renders.
- **Data gate**: row level security. Only admins can read or change teams,
  players and payment screenshots, so skipping the HOC in the browser still
  returns nothing.
- Registrations are written only by `/api/register` with the service-role key,
  inside one transaction (`register_team`). The public can't read the tables.

## Registration rules enforced

- Exactly four players; player 1 is the team leader.
- Team names are unique, case-insensitive. The form checks live and shows
  "Team name already taken".
- A team names the one college it represents (free text). A Free Fire UID can
  only be on one team.
- Every player uploads a photo of their student ID card (private `id-cards`
  bucket, admins only). The form shrinks photos to ≤1600px JPEG before upload
  so a whole team stays under Vercel's 4.5 MB request limit.
- Payment is hidden until the rules have been scrolled to the end and all
  four players have ticked the consent statement.
- The dashboard can close registration; the landing and register pages pick
  that up on the next request.
