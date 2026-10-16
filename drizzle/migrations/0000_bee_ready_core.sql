create type public.app_role as enum ('worker','business');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.worker_profiles (
  user_id uuid primary key,
  full_name text not null default '',
  headline text not null default '',
  bio text not null default '',
  roles text[] not null default '{}',
  skills text[] not null default '{}',
  experience_years int not null default 0 check (experience_years >= 0),
  hourly_rate numeric(6,2) not null default 12 check (hourly_rate >= 0),
  area_name text not null default '',
  lat double precision,
  lng double precision,
  travel_radius_km int not null default 8 check (travel_radius_km between 1 and 100),
  ready_to_work boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  rating numeric(2,1) not null default 5.0,
  rating_count int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.worker_profiles to anon;
grant select, insert, update on public.worker_profiles to authenticated;
grant all on public.worker_profiles to service_role;
alter table public.worker_profiles enable row level security;
create policy "workers are discoverable" on public.worker_profiles for select to anon, authenticated using (true);
create policy "worker inserts own" on public.worker_profiles for insert to authenticated with check (user_id = auth.uid() and public.has_role(auth.uid(),'worker'));
create policy "worker updates own" on public.worker_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- privacy: coarsen worker location to ~1km and protect rating fields
create or replace function public.worker_profiles_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.lat is not null then new.lat := round(new.lat::numeric, 2)::double precision; end if;
  if new.lng is not null then new.lng := round(new.lng::numeric, 2)::double precision; end if;
  if tg_op = 'UPDATE' and current_user = 'authenticated' then
    new.rating := old.rating; new.rating_count := old.rating_count; new.is_demo := old.is_demo;
  end if;
  if tg_op = 'INSERT' and current_user = 'authenticated' then
    new.rating := 5.0; new.rating_count := 0; new.is_demo := false;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger worker_profiles_guard before insert or update on public.worker_profiles
for each row execute function public.worker_profiles_guard();

create table public.business_profiles (
  user_id uuid primary key,
  name text not null default '',
  business_type text not null default 'Pub',
  description text not null default '',
  address text not null default '',
  area_name text not null default '',
  lat double precision,
  lng double precision,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.business_profiles to anon;
grant select, insert, update on public.business_profiles to authenticated;
grant all on public.business_profiles to service_role;
alter table public.business_profiles enable row level security;
create policy "businesses are public" on public.business_profiles for select to anon, authenticated using (true);
create policy "business inserts own" on public.business_profiles for insert to authenticated with check (user_id = auth.uid() and public.has_role(auth.uid(),'business'));
create policy "business updates own" on public.business_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(user_id) on delete cascade,
  role text not null,
  title text not null default '',
  description text not null default '',
  required_skills text[] not null default '{}',
  min_experience_years int not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hourly_rate numeric(6,2) not null check (hourly_rate > 0),
  workers_needed int not null default 1 check (workers_needed between 1 and 50),
  location_name text not null default '',
  lat double precision not null,
  lng double precision not null,
  is_urgent boolean not null default false,
  status text not null default 'open' check (status in ('open','filled','cancelled','completed')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.shifts to anon;
grant select, insert, update, delete on public.shifts to authenticated;
grant all on public.shifts to service_role;
alter table public.shifts enable row level security;
create policy "shifts are public" on public.shifts for select to anon, authenticated using (true);
create policy "business inserts own shifts" on public.shifts for insert to authenticated with check (business_id = auth.uid() and public.has_role(auth.uid(),'business'));
create policy "business updates own shifts" on public.shifts for update to authenticated using (business_id = auth.uid()) with check (business_id = auth.uid());
create policy "business deletes own shifts" on public.shifts for delete to authenticated using (business_id = auth.uid());

create or replace function public.shifts_validate()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.ends_at <= new.starts_at then raise exception 'Shift must end after it starts'; end if;
  if new.ends_at - new.starts_at > interval '16 hours' then raise exception 'Shifts cannot exceed 16 hours'; end if;
  return new;
end $$;
create trigger shifts_validate before insert or update on public.shifts for each row execute function public.shifts_validate();
create index on public.shifts (status, starts_at);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  status text not null check (status in ('applied','offered','confirmed','declined','rejected','completed')),
  match_score int,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, worker_id)
);
grant select on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "parties read applications" on public.applications for select to authenticated using (
  worker_id = auth.uid() or exists (select 1 from public.shifts s where s.id = shift_id and s.business_id = auth.uid())
);

alter publication supabase_realtime add table public.shifts;
alter publication supabase_realtime add table public.applications;

-- ===== RPCs (all state transitions go through these) =====
create or replace function public.set_my_role(_role public.app_role, _name text)
returns void language plpgsql security definer set search_path = public as $$
declare existing public.app_role;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select role into existing from public.user_roles where user_id = auth.uid();
  if existing is not null and existing <> _role then raise exception 'Account is already registered as %', existing; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), _role) on conflict (user_id) do nothing;
  if _role = 'worker' then
    insert into public.worker_profiles(user_id, full_name) values (auth.uid(), coalesce(_name,'')) on conflict do nothing;
  else
    insert into public.business_profiles(user_id, name) values (auth.uid(), coalesce(_name,'')) on conflict do nothing;
  end if;
end $$;

create or replace function public._confirm_application(_app_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a public.applications; s public.shifts; confirmed_count int;
begin
  select * into a from public.applications where id = _app_id;
  select * into s from public.shifts where id = a.shift_id for update;
  if s.status <> 'open' then raise exception 'This shift is no longer open'; end if;
  if s.ends_at < now() then raise exception 'This shift has already ended'; end if;
  if exists (
    select 1 from public.applications a2 join public.shifts s2 on s2.id = a2.shift_id
    where a2.worker_id = a.worker_id and a2.status = 'confirmed' and a2.id <> a.id
      and s2.status <> 'cancelled' and s2.starts_at < s.ends_at and s2.ends_at > s.starts_at
  ) then raise exception 'Worker is already booked for an overlapping shift'; end if;
  select count(*) into confirmed_count from public.applications where shift_id = s.id and status = 'confirmed';
  if confirmed_count >= s.workers_needed then raise exception 'This shift is already fully staffed'; end if;
  update public.applications set status = 'confirmed', updated_at = now() where id = a.id;
  if confirmed_count + 1 >= s.workers_needed then
    update public.shifts set status = 'filled' where id = s.id;
    update public.applications set status = case when status = 'offered' then 'declined' else 'rejected' end, updated_at = now()
      where shift_id = s.id and status in ('applied','offered');
  end if;
end $$;
revoke all on function public._confirm_application(uuid) from public, anon, authenticated;

create or replace function public.apply_to_shift(_shift_id uuid, _match_score int)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.shifts; new_id uuid;
begin
  if not public.has_role(auth.uid(),'worker') then raise exception 'Only workers can apply'; end if;
  select * into s from public.shifts where id = _shift_id;
  if s.id is null or s.status <> 'open' then raise exception 'Shift is not open'; end if;
  if s.ends_at < now() then raise exception 'Shift has ended'; end if;
  insert into public.applications(shift_id, worker_id, status, match_score)
  values (_shift_id, auth.uid(), 'applied', _match_score)
  on conflict (shift_id, worker_id) do nothing returning id into new_id;
  if new_id is null then raise exception 'You already have an application for this shift'; end if;
  return new_id;
end $$;

create or replace function public.offer_shift(_shift_id uuid, _worker_id uuid, _match_score int)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.shifts; new_id uuid;
begin
  select * into s from public.shifts where id = _shift_id;
  if s.id is null or s.business_id <> auth.uid() then raise exception 'Not your shift'; end if;
  if s.status <> 'open' then raise exception 'Shift is not open'; end if;
  insert into public.applications(shift_id, worker_id, status, match_score)
  values (_shift_id, _worker_id, 'offered', _match_score)
  on conflict (shift_id, worker_id) do nothing returning id into new_id;
  if new_id is null then raise exception 'This worker is already linked to this shift'; end if;
  return new_id;
end $$;

create or replace function public.respond_to_application(_app_id uuid, _accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.applications; s public.shifts;
begin
  select * into a from public.applications where id = _app_id;
  if a.id is null then raise exception 'Application not found'; end if;
  select * into s from public.shifts where id = a.shift_id;
  if a.status = 'applied' and s.business_id = auth.uid() then
    if _accept then perform public._confirm_application(a.id);
    else update public.applications set status='rejected', updated_at=now() where id=a.id; end if;
  elsif a.status = 'offered' and a.worker_id = auth.uid() then
    if _accept then perform public._confirm_application(a.id);
    else update public.applications set status='declined', updated_at=now() where id=a.id; end if;
  else
    raise exception 'You cannot respond to this application';
  end if;
end $$;

create or replace function public.complete_shift(_shift_id uuid, _rating int)
returns void language plpgsql security definer set search_path = public as $$
declare s public.shifts; r record;
begin
  select * into s from public.shifts where id = _shift_id;
  if s.id is null or s.business_id <> auth.uid() then raise exception 'Not your shift'; end if;
  if s.status not in ('open','filled') then raise exception 'Shift already closed'; end if;
  if _rating is not null and (_rating < 1 or _rating > 5) then raise exception 'Rating must be 1-5'; end if;
  for r in select * from public.applications where shift_id = s.id and status = 'confirmed' loop
    update public.applications set status='completed', rating=_rating, updated_at=now() where id=r.id;
    if _rating is not null then
      update public.worker_profiles set
        rating = round(((rating * rating_count) + _rating)::numeric / (rating_count + 1), 1),
        rating_count = rating_count + 1
      where user_id = r.worker_id;
    end if;
  end loop;
  update public.shifts set status='completed' where id = s.id;
  update public.applications set status='rejected', updated_at=now() where shift_id = s.id and status in ('applied','offered');
end $$;

create or replace function public.roll_demo_shifts()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.shifts set
    starts_at = starts_at + (ceil(extract(epoch from (now() - starts_at)) / 86400.0) * interval '1 day'),
    ends_at = ends_at + (ceil(extract(epoch from (now() - starts_at)) / 86400.0) * interval '1 day')
  where is_demo and status = 'open' and starts_at < now();
end $$;

revoke all on function public.set_my_role(public.app_role, text) from public, anon;
revoke all on function public.apply_to_shift(uuid,int) from public, anon;
revoke all on function public.offer_shift(uuid,uuid,int) from public, anon;
revoke all on function public.respond_to_application(uuid,boolean) from public, anon;
revoke all on function public.complete_shift(uuid,int) from public, anon;
revoke all on function public.roll_demo_shifts() from public, anon, authenticated;
grant execute on function public.set_my_role(public.app_role, text) to authenticated;
grant execute on function public.apply_to_shift(uuid,int) to authenticated;
grant execute on function public.offer_shift(uuid,uuid,int) to authenticated;
grant execute on function public.respond_to_application(uuid,boolean) to authenticated;
grant execute on function public.complete_shift(uuid,int) to authenticated;
grant execute on function public.roll_demo_shifts() to service_role;
grant execute on function public._confirm_application(uuid) to service_role;

-- ===== Demo data (fictional) =====
insert into public.worker_profiles (user_id, full_name, headline, bio, roles, skills, experience_years, hourly_rate, area_name, lat, lng, travel_radius_km, ready_to_work, rating, rating_count, is_demo) values
('00000000-0000-4000-a000-000000000001','Maya Okafor','Cocktail bartender & bar lead','Five years behind busy London bars. Calm under pressure, fast on the well.','{Bartender,Waiter}','{Cocktails,Cash handling,Personal licence,Wine service}',5,15,'Shadwell',51.51,-0.05,8,true,4.8,23,true),
('00000000-0000-4000-a000-000000000002','Tom Reilly','Barback & cellar hand','Keeps the bar stocked and the lines clean.','{Barback,Bartender}','{Cellar management,Glass collection}',2,12.5,'Bermondsey',51.50,-0.07,6,true,4.6,11,true),
('00000000-0000-4000-a000-000000000003','Priya Nair','Head waiter, fine dining','Silver service and allergens trained.','{Waiter,Host}','{Silver service,Allergen awareness,Wine service}',7,16,'Borough',51.50,-0.09,10,true,4.9,41,true),
('00000000-0000-4000-a000-000000000004','Jonas Weber','Line chef','Grill and sauté section, high-volume brunch.','{Chef}','{Food hygiene L2,Grill,Prep}',6,17.5,'Whitechapel',51.52,-0.06,12,true,4.7,18,true),
('00000000-0000-4000-a000-000000000005','Aisha Bello','Barista','Latte art, specialty filter, opens early.','{Barista,Waiter}','{Latte art,Cash handling}',3,12,'Spitalfields',51.52,-0.08,5,true,4.8,30,true),
('00000000-0000-4000-a000-000000000006','Luis Ortega','Kitchen porter','Reliable, quick, happy to do late finishes.','{Kitchen Porter}','{Food hygiene L2,Deep cleaning}',4,11.5,'Limehouse',51.51,-0.04,10,false,4.5,9,true),
('00000000-0000-4000-a000-000000000007','Grace Chen','Hotel housekeeping supervisor','Turnovers, linen and inspections.','{Housekeeping,Host}','{Room inspection,Team lead}',8,14,'Canary Wharf',51.50,-0.02,10,true,4.9,52,true),
('00000000-0000-4000-a000-000000000008','Sam Patel','Events & bartending','Weddings, festivals and pop-up bars.','{Event Staff,Bartender}','{Cocktails,Personal licence}',3,14,'Tower Hill',51.51,-0.08,15,true,4.4,7,true);

insert into public.business_profiles (user_id, name, business_type, description, address, area_name, lat, lng, is_demo) values
('00000000-0000-4000-b000-000000000001','The Harbour Pub','Pub','Riverside pub with a busy cocktail bar and Sunday roasts.','Wapping High St (approx.)','Wapping',51.5046,-0.0560,true),
('00000000-0000-4000-b000-000000000002','Saffron & Salt','Restaurant','Modern Indian small plates, 90 covers.','Borough High St (approx.)','Borough',51.5035,-0.0910,true),
('00000000-0000-4000-b000-000000000003','The Gilded Bee Hotel','Hotel','Boutique 60-room hotel with rooftop bar.','Tower Hill (approx.)','Tower Hill',51.5098,-0.0766,true),
('00000000-0000-4000-b000-000000000004','Grind & Gather','Café','Specialty coffee and brunch.','Commercial St (approx.)','Spitalfields',51.5196,-0.0749,true),
('00000000-0000-4000-b000-000000000005','Copper Tap Bar','Bar','Craft beer bar with live music weekends.','Bermondsey St (approx.)','Bermondsey',51.4985,-0.0805,true);

insert into public.shifts (id, business_id, role, title, description, required_skills, min_experience_years, starts_at, ends_at, hourly_rate, workers_needed, location_name, lat, lng, is_urgent, is_demo) values
('00000000-0000-4000-c000-000000000001','00000000-0000-4000-b000-000000000001','Bartender','2 bartenders tonight','Two staff called in sick. Busy cocktail service.','{Cocktails}',2, date_trunc('day', now()) + interval '18 hours', date_trunc('day', now()) + interval '23 hours',16,2,'The Harbour Pub, Wapping',51.5046,-0.0560,true,true),
('00000000-0000-4000-c000-000000000002','00000000-0000-4000-b000-000000000002','Waiter','Friday dinner service','Floor staff for a 90-cover service.','{Allergen awareness}',1, date_trunc('day', now()) + interval '1 day 17 hours', date_trunc('day', now()) + interval '1 day 23 hours',14.5,1,'Saffron & Salt, Borough',51.5035,-0.0910,false,true),
('00000000-0000-4000-c000-000000000003','00000000-0000-4000-b000-000000000003','Housekeeping','Weekend room turnovers','Full house after a conference.','{}',1, date_trunc('day', now()) + interval '1 day 9 hours', date_trunc('day', now()) + interval '1 day 15 hours',14,2,'The Gilded Bee Hotel, Tower Hill',51.5098,-0.0766,false,true),
('00000000-0000-4000-c000-000000000004','00000000-0000-4000-b000-000000000004','Barista','Early opening cover','Barista off sick — 7 AM open.','{Latte art}',1, date_trunc('day', now()) + interval '1 day 7 hours', date_trunc('day', now()) + interval '1 day 13 hours',13,1,'Grind & Gather, Spitalfields',51.5196,-0.0749,true,true),
('00000000-0000-4000-c000-000000000005','00000000-0000-4000-b000-000000000005','Barback','Live music night','Glass collection and restocking.','{}',0, date_trunc('day', now()) + interval '2 days 19 hours', date_trunc('day', now()) + interval '2 days 23 hours 30 minutes',12.5,1,'Copper Tap Bar, Bermondsey',51.4985,-0.0805,false,true),
('00000000-0000-4000-c000-000000000006','00000000-0000-4000-b000-000000000003','Bartender','Rooftop bar cover','Sunset service on the rooftop.','{Cocktails,Personal licence}',3, date_trunc('day', now()) + interval '2 days 17 hours', date_trunc('day', now()) + interval '2 days 23 hours',17,1,'The Gilded Bee Hotel, Tower Hill',51.5098,-0.0766,false,true),
('00000000-0000-4000-c000-000000000007','00000000-0000-4000-b000-000000000002','Chef','Line chef — grill section','Head chef on holiday.','{Grill}',3, date_trunc('day', now()) + interval '3 days 16 hours', date_trunc('day', now()) + interval '3 days 23 hours',18,1,'Saffron & Salt, Borough',51.5035,-0.0910,false,true);

-- past completed shift for history/earnings
insert into public.shifts (id, business_id, role, title, starts_at, ends_at, hourly_rate, workers_needed, location_name, lat, lng, status, is_demo) values
('00000000-0000-4000-c000-000000000099','00000000-0000-4000-b000-000000000001','Bartender','Quiz night cover', now() - interval '6 days', now() - interval '6 days' + interval '5 hours',15,1,'The Harbour Pub, Wapping',51.5046,-0.0560,'completed',true);

insert into public.applications (shift_id, worker_id, status, match_score, rating) values
('00000000-0000-4000-c000-000000000099','00000000-0000-4000-a000-000000000001','completed',92,5),
('00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-000000000008','applied',84,null),
('00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-000000000002','applied',71,null);