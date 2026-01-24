create extension if not exists "pgcrypto";

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  invite_code text not null unique
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  notes text null,
  target_date date null,
  status text not null default 'active' check (status in ('active', 'done')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  timezone text not null default 'Asia/Makassar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_index int not null check (day_index between 0 and 6),
  start_time time null,
  end_time time null,
  title text not null,
  location text null,
  notes text null,
  budget numeric null,
  status text not null default 'planned' check (status in ('planned', 'done')),
  assigned_to text null check (assigned_to in ('me', 'her', 'both') or assigned_to is null),
  order_index int not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger set_trip_items_updated_at
before update on public.trip_items
for each row execute function public.set_updated_at();

create or replace function public.is_couple_member(check_couple_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = check_couple_id
      and user_id = auth.uid()
  );
$$;

create index if not exists couple_members_user_id_idx on public.couple_members (user_id);
create index if not exists plans_couple_id_idx on public.plans (couple_id);
create index if not exists trips_couple_id_idx on public.trips (couple_id);
create index if not exists trip_items_trip_id_idx on public.trip_items (trip_id);

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.plans enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

create policy "couples_select_for_members"
  on public.couples
  for select
  using (public.is_couple_member(id));

create policy "couples_insert_authenticated"
  on public.couples
  for insert
  with check (auth.uid() is not null);

create policy "couples_update_for_members"
  on public.couples
  for update
  using (public.is_couple_member(id))
  with check (public.is_couple_member(id));

create policy "couples_delete_for_members"
  on public.couples
  for delete
  using (public.is_couple_member(id));

create policy "members_select_for_couple"
  on public.couple_members
  for select
  using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));

create policy "members_insert_self"
  on public.couple_members
  for insert
  with check (user_id = auth.uid());

create policy "members_delete_self"
  on public.couple_members
  for delete
  using (user_id = auth.uid());

create policy "plans_select_for_members"
  on public.plans
  for select
  using (public.is_couple_member(couple_id));

create policy "plans_insert_for_members"
  on public.plans
  for insert
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "plans_update_for_members"
  on public.plans
  for update
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "plans_delete_for_members"
  on public.plans
  for delete
  using (public.is_couple_member(couple_id));

create policy "trips_select_for_members"
  on public.trips
  for select
  using (public.is_couple_member(couple_id));

create policy "trips_insert_for_members"
  on public.trips
  for insert
  with check (public.is_couple_member(couple_id));

create policy "trips_update_for_members"
  on public.trips
  for update
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "trips_delete_for_members"
  on public.trips
  for delete
  using (public.is_couple_member(couple_id));

create policy "trip_items_select_for_members"
  on public.trip_items
  for select
  using (
    exists (
      select 1
      from public.trips
      where public.trips.id = trip_items.trip_id
        and public.is_couple_member(public.trips.couple_id)
    )
  );

create policy "trip_items_insert_for_members"
  on public.trip_items
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where public.trips.id = trip_items.trip_id
        and public.is_couple_member(public.trips.couple_id)
    )
  );

create policy "trip_items_update_for_members"
  on public.trip_items
  for update
  using (
    exists (
      select 1
      from public.trips
      where public.trips.id = trip_items.trip_id
        and public.is_couple_member(public.trips.couple_id)
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where public.trips.id = trip_items.trip_id
        and public.is_couple_member(public.trips.couple_id)
    )
  );

create policy "trip_items_delete_for_members"
  on public.trip_items
  for delete
  using (
    exists (
      select 1
      from public.trips
      where public.trips.id = trip_items.trip_id
        and public.is_couple_member(public.trips.couple_id)
    )
  );
