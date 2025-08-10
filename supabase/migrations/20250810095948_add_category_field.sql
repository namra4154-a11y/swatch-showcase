-- Add category field to products table
-- Create enum for the 7 specific categories
create type product_category as enum (
  'Kurta suit',
  'Jakit suit', 
  'Coat suit',
  'Jodhpuri suit',
  'Three peice indo suit',
  'Pathani suit',
  'others'
);

-- Add category column to products table
alter table public.products 
add column category product_category;

-- Create index on category for better performance
create index if not exists products_category_idx on public.products(category);

-- Update existing products to have a default category
update public.products 
set category = 'others' 
where category is null;

-- Make category required for future inserts
alter table public.products 
alter column category set not null;

-- Add default value for category
alter table public.products 
alter column category set default 'others';
