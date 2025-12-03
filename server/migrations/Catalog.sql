-- Add packages column to configurations table
ALTER TABLE configurations 
ADD COLUMN packages text[] NOT NULL DEFAULT ARRAY['Ultra', 'Premium', 'Budget']::text[];


-- Create catalog_items table
CREATE TABLE catalog_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  package TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries by service_type and package
CREATE INDEX idx_catalog_items_service_package ON catalog_items(service_type, package);