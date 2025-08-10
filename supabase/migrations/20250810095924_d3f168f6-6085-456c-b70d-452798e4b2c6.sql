-- Move extensions to the "extensions" schema to satisfy linter
create schema if not exists extensions;
alter extension if exists pg_trgm set schema extensions;
alter extension if exists pgcrypto set schema extensions;

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