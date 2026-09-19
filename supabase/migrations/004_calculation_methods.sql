-- Preserve old method results. Never return a noon snapshot as a JPL day scan.
alter table public.natal_charts add column calculation_key text not null default 'legacy-swiss-v1';
alter table public.natal_charts drop constraint natal_charts_pkey;
alter table public.natal_charts add primary key(profile_id,calculation_key);
alter table public.daily_readings add column calculation_key text not null default 'legacy-swiss-v1';
alter table public.daily_readings add column display_timezone text not null default 'UTC';
alter table public.daily_readings drop constraint daily_readings_profile_id_date_profile_version_key;
alter table public.daily_readings add constraint daily_reading_calculation_unique
  unique(profile_id,date,profile_version,calculation_key,display_timezone);
-- Old fold=0 defaults are not evidence of an explicit ambiguity choice.
alter table public.birth_profiles add column time_fold_confirmed boolean not null default false;
