-- Fix existing image paths in the products table
-- This script will update any image_path values that contain "product-images/" prefix
-- to just contain the relative path within the bucket

-- First, check what the current image_path values look like
SELECT id, design_no, image_path FROM products LIMIT 10;

-- Update any image_path values that start with "product-images/"
UPDATE products 
SET image_path = REPLACE(image_path, 'product-images/', '')
WHERE image_path LIKE 'product-images/%';

-- Verify the changes
SELECT id, design_no, image_path FROM products LIMIT 10;

-- If you need to revert, you can run:
-- UPDATE products 
-- SET image_path = 'product-images/' || image_path
-- WHERE image_path NOT LIKE 'product-images/%' AND image_path != '';
