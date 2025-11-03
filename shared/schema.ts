import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, check } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from 'uuid';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Configuration Schema
export const configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  logo: text("logo"),
  gstNumber: text("gst_number"),
  includeGst: text("include_gst").default("true"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  socialLinks: text("social_links").array(),
  termsAndConditions: text("terms_and_conditions"),
  signatureImage: text("signature_image"),
  assetCategories: text("asset_categories").array().notNull().default(sql`ARRAY[]::text[]`),
  assetPurchaseStatus: text("asset_purchase_status").array().notNull().default(sql`ARRAY['Existing', 'New']::text[]`),
  servicesProvided: text("services_provided").array().notNull().default(sql`ARRAY[]::text[]`),
  investmentTypes: text("investment_types").array().notNull().default(sql`ARRAY['Office']::text[]`),
  planStatuses: text("plan_statuses").array().notNull().default(sql`ARRAY['To Do', 'In Progress', 'Completed']::text[]`),
  roles: text("roles").array().notNull().default(sql`ARRAY['Designer']::text[]`),
  paymentModes: text("payment_modes").array().notNull().default(sql`ARRAY['Cash', 'Gray']::text[]`),
  paymentStatuses: text("payment_statuses").array().notNull().default(sql`ARRAY['To Do', 'Completed']::text[]`),
  vendorCategories: text("vendor_categories").array().notNull().default(sql`ARRAY['Decoration', 'Photography']::text[]`),
  expenseCategories: text("expense_categories").array().notNull().default(sql`ARRAY['Materials', 'Labor', 'Venue', 'Catering', 'Equipment', 'Transportation', 'Marketing', 'Miscellaneous']::text[]`),
});

// Assets Schema
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  purchaseDate: date("purchase_date"),
  purchasedAmount: decimal("purchased_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("Active"),
  detailsAndUse: text("details_and_use"),
  warranty: text("warranty"),
});

// Vendors Schema
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category"),
  specialization: text("specialization"),
  location: text("location"),
  contactInfo: text("contact_info"),
  rating: integer("rating").default(0),
});

// Team Members Schema
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
});

// Expenses Schema
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  paid_by: text("paid_by").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  mode: text("mode"),
  date: date("date").notNull(),
  status: text("status").notNull().default("Pending"),
  contributor: text("contributor").array(),
  contribution: decimal("contribution", { precision: 10, scale: 2 }).array(),
  contribution_status: text("contribution_status").array(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Events Schema
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providedService: text("provided_service").notNull(),
  eventName: text("event_name").notNull(),
  eventDate: date("event_date").notNull(),
  venue: text("venue").notNull(),
  source: text("source"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  eventStatus: text("event_status").notNull().default("Draft"),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  paymentMode: text("payment_mode"),
  notes: text("notes"),
  registeredOn: date("registered_on").notNull().default(sql`CURRENT_DATE`),
  finalizedQuote: decimal("finalized_quote", { precision: 10, scale: 2 }),
  initialQuote: decimal("initial_quote", { precision: 10, scale: 2 }),
  ddcCost: decimal("ddc_cost", { precision: 10, scale: 2 }),
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }),
});

// Requirements Schema (nested under Events)
export const requirements = pgTable("requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  requirement: text("requirement").notNull(),
  description: text("description").notNull().default(''),
  requirementOwner: text("requirement_owner"),
  requirementStatus: text("requirement_status").notNull().default("To Do"),
  order: integer("order").notNull().default(0),
  price: integer("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(1),
});

// Fulfillment Plans Schema (nested under Requirements)
// In your schema.ts file
// Create a custom date schema that can handle both string and Date objects
const dateSchema = z.union([z.string(), z.date()]).transform((val) => {
  if (val instanceof Date) return val;
  return new Date(val);
});

export const fulfillmentPlans = pgTable('fulfillment_plans', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  requirementId: text('requirement_id').notNull().references(() => requirements.id, { onDelete: 'cascade' }),
  planType: text('plan_type', { enum: ['Vendor', 'Team', 'Asset'] }).notNull(),
  
  // Vendor fields
  vendorId: text('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  vendorCategory: text('vendor_category'),
  
  // Team fields
  teamMemberId: text('team_member_id').references(() => teamMembers.id, { onDelete: 'set null' }),
  teamRole: text('team_role'),
  
  // Asset fields
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  assetPurchaseStatus: text('asset_purchase_status'),
  assetCategory: text('asset_category'),

  // Payment field (common for all plan types)
  payment: decimal('payment', { precision: 10, scale: 2 }),
  paymentStatus: text('payment_status'),

  // Common fields
  planStatus: text('plan_status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Add check constraints
  chkVendorPlan: check('chk_vendor_plan', 
    sql`(plan_type = 'Vendor' AND vendor_id IS NOT NULL) OR plan_type != 'Vendor'`),
  chkTeamPlan: check('chk_team_plan',
    sql`(plan_type = 'Team' AND team_member_id IS NOT NULL) OR plan_type != 'Team'`),
  chkAssetPlan: check('chk_asset_plan',
    sql`(plan_type = 'Asset' AND asset_id IS NOT NULL) OR plan_type != 'Asset'`),
}));

// Insert Schemas
export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses)
  .omit({ id: true })
  .extend({
    contributor: z.array(z.string()).optional().default([]),
    contribution: z.array(z.number()).optional().default([]),
    contribution_status: z.array(z.string()).optional().default([]),
  });
export const insertEventSchema = createInsertSchema(events)
  .omit({ id: true })
  .extend({
    initialQuote: z.string().optional().transform((val) => val === "" ? undefined : val),
    finalizedQuote: z.string().optional().transform((val) => val === "" ? undefined : val),
    ddcCost: z.string().optional().transform((val) => val === "" ? undefined : val),
    profitLoss: z.string().optional().transform((val) => val === "" ? undefined : val),
    registeredOn: dateSchema.optional(),
  });
export const insertRequirementSchema = createInsertSchema(requirements).omit({ id: true });
export const insertFulfillmentPlanSchema = createInsertSchema(fulfillmentPlans, {
  // Use the custom date schema for date fields
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
  // Handle payment as string for form input
  payment: z.union([z.string(), z.number()])
    .transform(val => val === "" ? undefined : val)
    .pipe(z.coerce.number().nullable().optional()),
}).omit({ id: true });

// Types
export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;

// Base types from the database
export type FulfillmentPlan = typeof fulfillmentPlans.$inferSelect;

// Form type that handles string/number conversions
export type FulfillmentPlanForm = Omit<FulfillmentPlan, 'payment'> & {
  payment?: string | null;
};

// Insert type with proper transformations
export type InsertFulfillmentPlan = Omit<z.infer<typeof insertFulfillmentPlanSchema>, 'payment'> & {
  payment?: string | number | null;
};
