-- Enable required extensions
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  design_no text not null unique,
  fabric_supplier text,
  fabric_name text,
  fabric_rate_inr numeric(10,2),
  panno_inch numeric(6,2),
  matching text,
  matching_fabric_rate_inr numeric(10,2),
  matching_fabric_panno_inch numeric(6,2),
  product_rate_inr numeric(10,2) not null,
  image_path text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure RLS is disabled as per spec (public table)
alter table public.products disable row level security;

-- Function & trigger to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();

-- Indexes
create index if not exists products_design_no_idx on public.products(design_no);
create index if not exists products_tags_idx on public.products using gin(tags);
create index if not exists products_search_idx on public.products using gin (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(design_no,'') || ' ' || coalesce(fabric_name,''))
);

-- Create public storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage policies: Public read, allow anonymous uploads to this bucket
-- Drop if they already exist to keep migration idempotent
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Public upload product images" on storage.objects;
drop policy if exists "Public update product images" on storage.objects;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Public update product images"
  on storage.objects for update
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- Seed sample row if not exists (without image upload)
insert into public.products (
  name, design_no, fabric_supplier, fabric_name, fabric_rate_inr, panno_inch,
  matching, matching_fabric_rate_inr, matching_fabric_panno_inch, product_rate_inr, image_path, tags
)
select 'jakit suit', '820', 'M Mahindra Kumar', 'computer emb', 350.00, 38.00,
       'rayon', 65.00, 44.00, 1295.00, 'product-images/820/main.webp', array[]::text[]
where not exists (select 1 from public.products where design_no = '820');