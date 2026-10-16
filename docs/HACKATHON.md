# Bee Ready Agency — Hackathon Guide

*The Right Staff, Right When You Need Them.*

## 1. Architecture

```text
Browser (React 19 + TanStack Start, Tailwind v4, Leaflet/OSM)
   │  supabase-js (anon key + user session)        │ createServerFn (demo accounts only)
   ▼                                                ▼
Lovable Cloud (Postgres + Auth + Realtime)  ◄── service role (server only)
   - Row Level Security on every table
   - All booking state changes via SECURITY DEFINER RPCs
```

| Path | Purpose |
| --- | --- |
| `src/routes/index.tsx` | Landing page (live shifts, workers, map) |
| `src/routes/auth.tsx` | Sign in / sign up / Google / one-click demo |
| `src/routes/_authenticated/dashboard.tsx` | Role onboarding + redirect |
| `src/routes/_authenticated/worker.tsx` | Worker dashboard (Bee Match, Bee SOS, offers, profile) |
| `src/routes/_authenticated/business.tsx` | Business dashboard (post, SOS, applicants, discover, history) |
| `src/lib/bee-match.ts` | Transparent rule-based matching (+ tests) |
| `src/lib/demo.functions.ts` | Creates demo judge logins and rolls demo shift dates forward |
| `drizzle/migrations/0000_bee_ready_core.sql` | Full schema, RLS, RPCs, demo seed |

## 2. Database & security
Tables: `user_roles`, `worker_profiles`, `business_profiles`, `shifts`, `applications`.

- Roles live in `user_roles` (not editable by users; set once via `set_my_role`).
- Workers/businesses can only update their own profile; businesses only their own shifts.
- Applications are readable only by the worker and the business that owns the shift; they can **only** be changed through RPCs:
  `apply_to_shift`, `offer_shift`, `respond_to_application`, `complete_shift`.
- Confirmation locks the shift row, rejects **overlapping confirmed bookings** for the worker and over-staffing.
- Worker coordinates are rounded to 2 decimals (~1 km) by trigger. Maps draw areas, not pins.
- Ratings can only change through `complete_shift`.

## 3. Bee Match (rule-based, not AI)
Role 30 · Skills 15 · Distance 20 (inside travel radius only) · Experience 15 · Pay vs preferred rate 10 · Availability 10.
Every card has "Why this score?" with the point breakdown.

## 4. Demo
Sign-in page → **Worker: Maya** or **Harbour Pub**. Demo records show a "Demo data" badge; testimonials are labelled as examples.
Core flow: Harbour Pub → Bee SOS → Maya sees the SOS banner (realtime) → Apply → Harbour Pub → Accept → both dashboards show Confirmed.

## 5. Local setup
```bash
bun install
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# apply drizzle/migrations/0000_bee_ready_core.sql to your Postgres/Supabase project
bun run dev            # http://localhost:8080
bun run test           # Bee Match unit tests
```

## 6. Deployment
In Lovable click **Publish**. For self-hosting: `bun run build` deploys to Cloudflare Workers (`wrangler deploy`); set the same env vars as secrets.

## 7. Three-minute pitch
**0:00 – The problem (30s).** It's 4 PM on a Friday. Two bartenders at The Harbour Pub call in sick. The manager spends the next two hours texting everyone they know. Across the UK, hospitality loses shifts, revenue and staff wellbeing to last-minute gaps — while thousands of skilled workers want flexible extra hours but can't find them.

**0:30 – The solution (30s).** Bee Ready Agency: *Short staffed? Bee Ready.* Businesses post a shift or hit **Bee SOS**. Workers flip one switch — **Ready to Work**. **Bee Match** connects them in minutes.

**1:00 – Live demo (75s).** Harbour Pub sends a Bee SOS: 2 bartenders, tonight, 6–11, £16/hour. Switch to Maya: an urgent alert appears instantly with "99% Match — experienced bartender, available tonight, within travel radius". Open "Why this score?" — every point is explained. She applies. Back to the pub: accept. Both dashboards show the confirmed shift, with earnings estimate for Maya.

**2:15 – Trust & humanity (30s).** Bee Match is transparent rules, not a black box. Workers' homes are never shown — only approximate areas. Double-bookings are blocked at the database. Workers set their own rate and radius: dignity and flexibility, not gig-economy roulette.

**2:45 – What's next (15s).** Verified right-to-work checks, instant pay, and reliability scores. Bee Ready: the right staff, right when you need them.
