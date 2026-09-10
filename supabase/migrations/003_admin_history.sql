create table public.knowledge_versions (
 key text not null,
 version integer not null,
 payload jsonb not null,
 status text not null,
 created_at timestamptz not null default now(),
 primary key(key,version)
);
alter table public.knowledge_versions enable row level security;
create function public.version_knowledge() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then new.version=old.version+1; end if;
 return new;
end $$;
create trigger version_knowledge before update on public.interpretations for each row execute function public.version_knowledge();
create function public.record_knowledge() returns trigger language plpgsql set search_path='' as $$
begin
 insert into public.knowledge_versions(key,version,payload,status) values(new.key,new.version,new.payload,new.status);
 return new;
end $$;
create trigger record_knowledge after insert or update on public.interpretations for each row execute function public.record_knowledge();
insert into public.knowledge_versions(key,version,payload,status) select key,version,payload,status from public.interpretations;

create table public.runtime_config (
 key text primary key check(key in ('astrology','language')),
 payload jsonb not null,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.runtime_config enable row level security;
create table public.prompt_versions (
 id bigint generated always as identity primary key,
 config_key text not null,
 version integer not null,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.prompt_versions enable row level security;
create function public.version_config() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then new.version=old.version+1; end if;
 return new;
end $$;
create trigger version_config before update on public.runtime_config for each row execute function public.version_config();
create function public.record_config() returns trigger language plpgsql set search_path='' as $$
begin
 insert into public.prompt_versions(config_key,version,payload) values(new.key,new.version,new.payload);
 return new;
end $$;
create trigger record_config after insert or update on public.runtime_config for each row execute function public.record_config();

create table public.subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check(plan in ('free','premium')),
 status text not null default 'active',
 created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy read_own_subscription on public.subscriptions for select to authenticated using(auth.uid()=user_id);
grant select on public.subscriptions to authenticated;
revoke all on public.runtime_config,public.prompt_versions,public.knowledge_versions,public.subscriptions from anon;
