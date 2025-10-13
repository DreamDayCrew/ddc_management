import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date } from "drizzle-orm/pg-core";
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
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  mode: text("mode"),
  date: date("date").notNull(),
  status: text("status").notNull().default("Pending"),
});

// Events Schema
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providedService: text("provided_service").notNull(),
  eventName: text("event_name").notNull(),
  registeredOn: date("registered_on").notNull(),
  eventDate: date("event_date").notNull(),
  venue: text("venue").notNull(),
  clientInfo: text("client_info"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientEmail: text("client_email"),
  eventStatus: text("event_status").notNull().default("Inquired"),
  initialQuote: decimal("initial_quote", { precision: 10, scale: 2 }),
  finalizedQuote: decimal("finalized_quote", { precision: 10, scale: 2 }),
  ddcCost: decimal("ddc_cost", { precision: 10, scale: 2 }),
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }),
  paymentMode: text("payment_mode"),
  paymentStatus: text("payment_status").notNull().default("Pending"),
});

// Requirements Schema (nested under Events)
export const requirements = pgTable("requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  requirement: text("requirement").notNull(),
  requirementOwner: text("requirement_owner"),
  requirementStatus: text("requirement_status").notNull().default("To Do"),
  order: integer("order").notNull().default(0),
});

// Fulfillment Plans Schema (nested under Requirements)
export const fulfillmentPlans = pgTable("fulfillment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requirementId: varchar("requirement_id").notNull().references(() => requirements.id),
  planType: text("plan_type").notNull(),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id),
  teamRole: text("team_role"),
  payment: decimal("payment", { precision: 10, scale: 2 }),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  vendorAmount: decimal("vendor_amount", { precision: 10, scale: 2 }),
  vendorPaymentStatus: text("vendor_payment_status"),
  assetId: varchar("asset_id").references(() => assets.id),
  assetPurchaseStatus: text("asset_purchase_status"),
  purchasedValue: decimal("purchased_value", { precision: 10, scale: 2 }),
  planStatus: text("plan_status").notNull().default("To Do"),
});

// Insert Schemas
export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertRequirementSchema = createInsertSchema(requirements).omit({ id: true });
export const insertFulfillmentPlanSchema = createInsertSchema(fulfillmentPlans).omit({ id: true });

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
export type FulfillmentPlan = typeof fulfillmentPlans.$inferSelect;
export type InsertFulfillmentPlan = z.infer<typeof insertFulfillmentPlanSchema>;
