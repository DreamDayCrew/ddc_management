-- Add event discount columns to events table
ALTER TABLE "events" 
ADD COLUMN "event_discount" text DEFAULT 'false',
ADD COLUMN "event_discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN "discount" text DEFAULT 'false',
ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL,
ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- Add requirement discount columns to requirements table
ALTER TABLE "requirements" 
ADD COLUMN "req_discount" text DEFAULT 'false',
ADD COLUMN "req_discount_amount" numeric(10, 2) DEFAULT 0,
ADD COLUMN "images" text[] DEFAULT ARRAY[]::text[];

-- Add additional columns to team_members table
ALTER TABLE "team_members"
ADD COLUMN "email" text NOT NULL DEFAULT '',
ADD COLUMN "phone" text NOT NULL DEFAULT '',
ADD COLUMN "password" text NOT NULL DEFAULT '',
ADD COLUMN "using_mobile_app" text DEFAULT 'false';

-- Add additional columns to configurations table
ALTER TABLE "configurations"
ADD COLUMN "pan_number" text,
ADD COLUMN "upi_id" text,
ADD COLUMN "upi_qr_code" text,
ADD COLUMN "account_holder_name" text,
ADD COLUMN "bank_name" text,
ADD COLUMN "account_number" text,
ADD COLUMN "ifsc_code" text,
ADD COLUMN "packages" text[] DEFAULT ARRAY['Ultra', 'Premium', 'Budget']::text[] NOT NULL;

-- Add additional columns to expenses table
ALTER TABLE "expenses"
ADD COLUMN "event_id" varchar,
ADD COLUMN "fulfillment_plan_id" varchar,
ADD COLUMN "asset_id" varchar;

-- Create catalog_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS "catalog_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type" text NOT NULL,
	"package" text NOT NULL,
	"item_name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);