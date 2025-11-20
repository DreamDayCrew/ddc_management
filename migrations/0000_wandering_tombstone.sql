CREATE TABLE "account_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'DDC Fund',
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"purchase_date" date,
	"purchased_amount" numeric(10, 2),
	"status" text DEFAULT 'Active' NOT NULL,
	"details_and_use" text,
	"warranty" text
);
--> statement-breakpoint
CREATE TABLE "configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"logo" text,
	"gst_number" text,
	"include_gst" text DEFAULT 'true',
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"social_links" text[],
	"terms_and_conditions" text,
	"signature_image" text,
	"asset_categories" text[] DEFAULT ARRAY['Audio System','Decoration','Furniture','Photography','Lighting','Stage Equipment','Electrical / Wires','Office use / Safety']::text[] NOT NULL,
	"asset_purchase_status" text[] DEFAULT ARRAY['Existing', 'New']::text[] NOT NULL,
	"services_provided" text[] DEFAULT ARRAY['Wedding Planning & Décor','Engagements & Receptions','Birthday & Anniversary Celebrations','Corporate Events & Launchs','Cultural & Theme Events','Marathons, carnivals, stage plays, and non-profit initiatives','Service & Installation','Devotional events']::text[] NOT NULL,
	"investment_types" text[] DEFAULT ARRAY['Office','Equipment','Marketing','Inventory']::text[] NOT NULL,
	"plan_statuses" text[] DEFAULT ARRAY['To Do','In Progress','Completed','Blocker']::text[] NOT NULL,
	"roles" text[] DEFAULT ARRAY['Designer','Coordinator','Manager','Technical Support','Decorator','Logistics','Purchasing Items']::text[] NOT NULL,
	"payment_modes" text[] DEFAULT ARRAY['Cash','Bank Transfer','UPI']::text[] NOT NULL,
	"payment_statuses" text[] DEFAULT ARRAY['Pending', 'Paid','Partial']::text[] NOT NULL,
	"vendor_categories" text[] DEFAULT ARRAY['Decoration','Photography','Catering','Audio/Visual','Venue','Transportation','Lightings']::text[] NOT NULL,
	"expense_categories" text[] DEFAULT ARRAY['Office','Event','Asset']::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provided_service" text NOT NULL,
	"event_name" text NOT NULL,
	"event_date" date NOT NULL,
	"venue" text NOT NULL,
	"source" text,
	"client_name" text,
	"client_phone" text,
	"client_email" text,
	"client_address" text,
	"event_status" text DEFAULT 'Draft' NOT NULL,
	"payment_status" text DEFAULT 'Pending' NOT NULL,
	"payment_mode" text,
	"notes" text,
	"registered_on" date DEFAULT CURRENT_DATE NOT NULL,
	"finalized_quote" numeric(10, 2),
	"initial_quote" numeric(10, 2),
	"ddc_cost" numeric(10, 2),
	"profit_loss" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"category" text DEFAULT 'Event' NOT NULL,
	"from_account" text DEFAULT 'DDC Fund' NOT NULL,
	"to_account" text,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"split_type" text,
	"contributor" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"contribution" numeric(10, 2)[] DEFAULT ARRAY[]::numeric[] NOT NULL,
	"contribution_status" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"closing_balance" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses_with_balance" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"from_account" text NOT NULL,
	"to_account" text,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"split_type" text,
	"contributor" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"contribution" numeric(10, 2)[] DEFAULT ARRAY[]::numeric[] NOT NULL,
	"contribution_status" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"closing_balance" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "fulfillment_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"requirement_id" text NOT NULL,
	"plan_type" text NOT NULL,
	"vendor_id" text,
	"vendor_category" text,
	"team_member_id" text,
	"team_role" text,
	"asset_id" text,
	"asset_purchase_status" text,
	"asset_category" text,
	"payment" numeric(10, 2),
	"payment_status" text,
	"plan_status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_vendor_plan" CHECK ((plan_type = 'Vendor' AND vendor_id IS NOT NULL) OR plan_type != 'Vendor'),
	CONSTRAINT "chk_team_plan" CHECK ((plan_type = 'Team' AND team_member_id IS NOT NULL) OR plan_type != 'Team'),
	CONSTRAINT "chk_asset_plan" CHECK ((plan_type = 'Asset' AND asset_id IS NOT NULL) OR plan_type != 'Asset')
);
--> statement-breakpoint
CREATE TABLE "repayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" text NOT NULL,
	"allocated_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"repaid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"requirement" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"requirement_owner" text,
	"requirement_status" text DEFAULT 'To Do' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"specialization" text,
	"location" text,
	"contact_info" text,
	"rating" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "fulfillment_plans" ADD CONSTRAINT "fulfillment_plans_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_plans" ADD CONSTRAINT "fulfillment_plans_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_plans" ADD CONSTRAINT "fulfillment_plans_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_plans" ADD CONSTRAINT "fulfillment_plans_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;