-- Run in the Supabase SQL editor. No public birth-profile access.
create table public.birth_profiles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 name text not null check (length(name) between 1 and 120),
 birth_date date not null,
 birth_time time,
 birth_time_known boolean not null,
 birth_city text not null,
 birth_country text not null,
 latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180),
 timezone text not null,
 utc_birth_datetime timestamptz not null,
 time_fold integer not null default 0 check(time_fold in (0,1)),
 is_primary boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (birth_time_known = (birth_time is not null))
);
create unique index one_primary_profile on public.birth_profiles(user_id) where is_primary;
alter table public.birth_profiles enable row level security;
create policy own_profiles on public.birth_profiles for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

create table public.natal_charts (
 profile_id uuid primary key references public.birth_profiles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 chart_json jsonb not null,
 profile_version timestamptz not null,
 calculation_version text not null,
 created_at timestamptz not null default now()
);
create table public.daily_readings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 profile_id uuid not null references public.birth_profiles(id) on delete cascade,
 date date not null,
 profile_version timestamptz not null,
 reading_json jsonb not null,
 model_version text not null,
 prompt_version text not null,
 knowledge_version text not null,
 created_at timestamptz not null default now(),
 unique(profile_id,date,profile_version)
);
create table public.compatibility_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 first_profile uuid not null references public.birth_profiles(id) on delete cascade,
 second_profile uuid not null references public.birth_profiles(id) on delete cascade,
 report_json jsonb not null,
 created_at timestamptz not null default now()
);
-- Calculations are writable only by the authenticated backend's service role.
alter table public.natal_charts enable row level security;
alter table public.daily_readings enable row level security;
alter table public.compatibility_reports enable row level security;
create policy read_own_charts on public.natal_charts for select to authenticated using(auth.uid()=user_id);
create policy read_own_daily on public.daily_readings for select to authenticated using(auth.uid()=user_id);
create policy read_own_reports on public.compatibility_reports for select to authenticated using(auth.uid()=user_id);

create table public.interpretations (
 key text primary key,
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 status text not null default 'draft' check(status in ('draft','review','approved','archived')),
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.interpretations enable row level security;
-- Admin writes are routed through the backend, which checks app_metadata.role.
create policy read_approved on public.interpretations for select to authenticated using(status='approved');
create table public.generation_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 event text not null,
 details jsonb not null default '{}',
 created_at timestamptz not null default now()
);
alter table public.generation_logs enable row level security;

create function public.touch_birth_profile() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger touch_birth_profile before update on public.birth_profiles for each row execute function public.touch_birth_profile();
