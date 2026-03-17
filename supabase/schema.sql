create table if not exists public.treasure_hunt_progress (
  event_key text primary key,
  validated_step_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.treasure_hunt_content (
  event_key text primary key,
  hunt_config jsonb not null default '{}'::jsonb,
  treasure_steps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_treasure_hunt_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists treasure_hunt_progress_set_updated_at on public.treasure_hunt_progress;
drop trigger if exists treasure_hunt_content_set_updated_at on public.treasure_hunt_content;

create trigger treasure_hunt_progress_set_updated_at
before update on public.treasure_hunt_progress
for each row
execute function public.set_treasure_hunt_updated_at();

create trigger treasure_hunt_content_set_updated_at
before update on public.treasure_hunt_content
for each row
execute function public.set_treasure_hunt_updated_at();

insert into public.treasure_hunt_progress (event_key, validated_step_ids)
values ('archives-treasures-hunt', '[]'::jsonb)
on conflict (event_key) do nothing;

insert into public.treasure_hunt_content (event_key, hunt_config, treasure_steps)
values ('archives-treasures-hunt', '{}'::jsonb, '[]'::jsonb)
on conflict (event_key) do nothing;
