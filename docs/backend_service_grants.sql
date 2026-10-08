-- Reviewed hardening SQL: append to the atomic fresh-project baseline,
-- or place in a CLI-generated migration for a project already using 001-004.
-- Run after migrations 001-004. No ownership policies or RLS bypass attributes change.
-- Remove inherited privileges, including TRUNCATE/REFERENCES/TRIGGER/MAINTAIN.
revoke all privileges on table
 public.birth_profiles, public.natal_charts, public.daily_readings,
 public.compatibility_reports, public.interpretations, public.generation_logs,
 public.knowledge_versions, public.runtime_config, public.prompt_versions,
 public.subscriptions
 from public, anon, authenticated, service_role;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.birth_profiles to authenticated;
grant select on public.natal_charts, public.daily_readings,
 public.compatibility_reports, public.interpretations, public.subscriptions to authenticated;

-- Only operations exercised by the application and its invoker history triggers.
grant select, insert, update on public.birth_profiles to service_role;
grant select, insert, update, delete on public.natal_charts to service_role;
grant select, insert on public.daily_readings, public.compatibility_reports,
 public.generation_logs, public.knowledge_versions, public.prompt_versions to service_role;
grant select, insert, update on public.interpretations, public.runtime_config to service_role;
grant select on public.subscriptions to service_role;

revoke all privileges on sequence public.prompt_versions_id_seq
 from public, anon, authenticated, service_role;
grant usage on sequence public.prompt_versions_id_seq to service_role;

-- Triggers are already attached. Direct RPC execution is unnecessary.
revoke execute on function public.touch_birth_profile(), public.version_knowledge(),
 public.record_knowledge(), public.version_config(), public.record_config()
 from public, anon, authenticated, service_role;
