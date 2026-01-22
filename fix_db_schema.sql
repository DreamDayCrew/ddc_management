ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "event_discount" text DEFAULT 'false',
ADD COLUMN IF NOT EXISTS "event_discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discount" text DEFAULT 'false',
ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Also add missing columns to requirements table
ALTER TABLE "requirements" 
ADD COLUMN IF NOT EXISTS "req_discount" text DEFAULT 'false',
ADD COLUMN IF NOT EXISTS "req_discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[];

-- Add missing columns to team_members table  
ALTER TABLE "team_members"
ADD COLUMN IF NOT EXISTS "email" text DEFAULT '',
ADD COLUMN IF NOT EXISTS "phone" text DEFAULT '',
ADD COLUMN IF NOT EXISTS "password" text DEFAULT '',
ADD COLUMN IF NOT EXISTS "using_mobile_app" text DEFAULT 'false';

-- Add missing columns to configurations table
ALTER TABLE "configurations"
ADD COLUMN IF NOT EXISTS "pan_number" text,
ADD COLUMN IF NOT EXISTS "upi_id" text,
ADD COLUMN IF NOT EXISTS "upi_qr_code" text,
ADD COLUMN IF NOT EXISTS "account_holder_name" text,
ADD COLUMN IF NOT EXISTS "bank_name" text,
ADD COLUMN IF NOT EXISTS "account_number" text,
ADD COLUMN IF NOT EXISTS "ifsc_code" text,
ADD COLUMN IF NOT EXISTS "packages" text[] DEFAULT ARRAY['Ultra', 'Premium', 'Budget']::text[];

-- Add missing columns to expenses table
ALTER TABLE "expenses"
ADD COLUMN IF NOT EXISTS "event_id" varchar,
ADD COLUMN IF NOT EXISTS "fulfillment_plan_id" varchar,
ADD COLUMN IF NOT EXISTS "asset_id" varchar;

-- Create catalog_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS "catalog_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_type" text NOT NULL,
	"package" text NOT NULL,
	"item_name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);