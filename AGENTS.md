<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Application state transitions (apply, offer, accept/decline, complete) go only through SECURITY DEFINER RPCs; `applications` has no client write policies — keeps overlap/capacity rules enforced in one place.
- Matching logic lives in `src/lib/bee-match.ts` as pure, rule-based functions with tests — it must stay explainable, never presented as AI.
- Worker locations are coarsened by a DB trigger and rendered as areas, never pins — privacy requirement.
- Leaflet is only loaded through `MapView` (lazy + ClientOnly) — Leaflet touches `window` on import.
- Demo judge accounts use fixed UUIDs matching seeded rows and are created on demand by `ensureDemoAccount` — seed data must not depend on auth.users rows.
- Anonymous visitors never read `worker_profiles` directly; the public site uses the `public_ready_workers` function, which returns limited fields only (privacy).
