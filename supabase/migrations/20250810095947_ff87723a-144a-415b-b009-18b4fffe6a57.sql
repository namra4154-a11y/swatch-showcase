-- Move extensions to the "extensions" schema using conditional DO blocks
create schema if not exists extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute 'alter extension pg_trgm set schema extensions';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pgcrypto') then
    execute 'alter extension pgcrypto set schema extensions';
  end if;
end $$;

-- Recreate function with explicit search_path to satisfy linter
create or replace function public.update_updated_at_column()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;