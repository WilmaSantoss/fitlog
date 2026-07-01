-- =============================================================
-- Fitlog — schema inicial pra Supabase Postgres
-- Rodar no Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================

-- ----------------------------------
-- 1. Tabelas
-- ----------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  height_cm   numeric,
  updated_at  timestamptz not null default now()
);

create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  notes       text,
  position    integer not null default 0,
  exercises   jsonb not null default '[]'::jsonb,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists routines_user_idx
  on public.routines(user_id, position);

create table if not exists public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  routine_id    uuid,
  routine_name  text not null,
  notes         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  exercises     jsonb not null default '[]'::jsonb,
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists sessions_user_finished_idx
  on public.workout_sessions(user_id, finished_at desc);

create index if not exists sessions_user_started_idx
  on public.workout_sessions(user_id, started_at desc);

create table if not exists public.measurements (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  recorded_at        timestamptz not null,
  weight_kg          numeric,
  bicep_left_cm      numeric,
  bicep_right_cm     numeric,
  forearm_left_cm    numeric,
  forearm_right_cm   numeric,
  belly_cm           numeric,
  waist_cm           numeric,
  glutes_cm          numeric,
  thigh_left_cm      numeric,
  thigh_right_cm     numeric,
  calf_left_cm       numeric,
  calf_right_cm      numeric,
  notes              text,
  is_deleted         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists measurements_user_idx
  on public.measurements(user_id, recorded_at desc);

-- ----------------------------------
-- 2. Row-Level Security: cada user só lê/escreve os próprios dados
-- ----------------------------------

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.measurements enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "routines_own" on public.routines;
create policy "routines_own" on public.routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sessions_own" on public.workout_sessions;
create policy "sessions_own" on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "measurements_own" on public.measurements;
create policy "measurements_own" on public.measurements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------
-- 3. Trigger: cria profile vazio automaticamente quando alguém faz signup
-- ----------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
