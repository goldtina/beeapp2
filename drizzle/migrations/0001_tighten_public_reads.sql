create or replace function public.worker_linked_to_shift(_shift_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications where shift_id = _shift_id and worker_id = auth.uid())
$$;
create or replace function public.worker_linked_to_business(_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id
                 where s.business_id = _business_id and a.worker_id = auth.uid())
$$;
create or replace function public.business_has_listing(_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shifts where business_id = _business_id and status in ('open','filled'))
$$;
create or replace function public.business_linked_to_worker(_worker_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications a join public.shifts s on s.id = a.shift_id
                 where a.worker_id = _worker_id and s.business_id = auth.uid())
$$;
revoke all on function public.worker_linked_to_shift(uuid), public.worker_linked_to_business(uuid), public.business_has_listing(uuid), public.business_linked_to_worker(uuid) from public;
grant execute on function public.worker_linked_to_shift(uuid), public.worker_linked_to_business(uuid), public.business_has_listing(uuid), public.business_linked_to_worker(uuid) to anon, authenticated;

drop policy "shifts are public" on public.shifts;
create policy "listed or related shifts readable" on public.shifts for select to anon, authenticated using (
  status in ('open','filled') or business_id = auth.uid() or public.worker_linked_to_shift(id)
);

drop policy "businesses are public" on public.business_profiles;
create policy "listed or related businesses readable" on public.business_profiles for select to anon, authenticated using (
  user_id = auth.uid() or public.business_has_listing(user_id) or public.worker_linked_to_business(user_id)
);

drop policy "workers are discoverable" on public.worker_profiles;
create policy "own, ready-for-business, or linked workers readable" on public.worker_profiles for select to authenticated using (
  user_id = auth.uid()
  or (ready_to_work and public.has_role(auth.uid(), 'business'))
  or public.business_linked_to_worker(user_id)
);
revoke select on public.worker_profiles from anon;

-- Limited public preview for the landing page: first name + initial, approximate area only.
create or replace function public.public_ready_workers(_limit int default 6)
returns table (user_id uuid, display_name text, headline text, roles text[], experience_years int,
               rating numeric, rating_count int, area_name text, lat double precision, lng double precision)
language sql stable security definer set search_path = public as $$
  select w.user_id,
         split_part(w.full_name, ' ', 1) || coalesce(' ' || nullif(left(split_part(w.full_name, ' ', 2), 1), '') || '.', ''),
         w.headline, w.roles, w.experience_years, w.rating, w.rating_count, w.area_name, w.lat, w.lng
  from public.worker_profiles w
  where w.ready_to_work
  order by w.rating desc
  limit least(greatest(_limit, 1), 24)
$$;
revoke all on function public.public_ready_workers(int) from public;
grant execute on function public.public_ready_workers(int) to anon, authenticated;