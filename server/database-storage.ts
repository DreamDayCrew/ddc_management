import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import {
  configurations,
  assets,
  vendors,
  teamMembers,
  expenses,
  events,
  requirements,
  fulfillmentPlans,
  type Configuration,
  type InsertConfiguration,
  type Asset,
  type InsertAsset,
  type Vendor,
  type InsertVendor,
  type TeamMember,
  type InsertTeamMember,
  type Expense,
  type InsertExpense,
  type Event,
  type InsertEvent,
  type Requirement,
  type InsertRequirement,
  type FulfillmentPlan,
  type InsertFulfillmentPlan,
} from "@shared/schema";
import { eq } from 'drizzle-orm';
import { type IStorage } from './storage';

// Configure Neon HTTP connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async testConnection(): Promise<boolean> {
    try {
      // Simple query to test connection
      const result = await db.select().from(vendors).limit(1);
      console.log('Database connection test successful with HTTP');
      return true;
    } catch (error) {
      console.error('Database connection test failed with HTTP:', error);
      return false;
    }
  }

  // Configuration
  async getConfiguration(): Promise<Configuration | undefined> {
    const result = await db.select().from(configurations).limit(1);
    return result[0];
  }

  async createConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const result = await db.insert(configurations).values(config).returning();
    return result[0];
  }

  async updateConfiguration(id: string, config: Partial<InsertConfiguration>): Promise<Configuration | undefined> {
    const result = await db.update(configurations)
      .set(config)
      .where(eq(configurations.id, id))
      .returning();
    return result[0];
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const result = await db.select().from(assets).where(eq(assets.id, id));
    return result[0];
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const result = await db.insert(assets).values(asset).returning();
    return result[0];
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const result = await db.update(assets)
      .set(asset)
      .where(eq(assets.id, id))
      .returning();
    return result[0];
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning();
    return result.length > 0;
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id));
    return result[0];
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const result = await db.insert(vendors).values(vendor).returning();
    return result[0];
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const result = await db.update(vendors)
      .set(vendor)
      .where(eq(vendors.id, id))
      .returning();
    return result[0];
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id)).returning();
    return result.length > 0;
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return result[0];
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const result = await db.update(teamMembers)
      .set(member)
      .where(eq(teamMembers.id, id))
      .returning();
    return result[0];
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();
    return result.length > 0;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // Requirements
  async getRequirements(eventId: string): Promise<Requirement[]> {
    return await db.select().from(requirements).where(eq(requirements.eventId, eventId));
  }

  async getAllRequirements(): Promise<Requirement[]> {
    return await db.select().from(requirements);
  }

  async getRequirement(id: string): Promise<Requirement | undefined> {
    const result = await db.select().from(requirements).where(eq(requirements.id, id));
    return result[0];
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const result = await db.insert(requirements).values(requirement).returning();
    return result[0];
  }

  async updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined> {
    const result = await db.update(requirements)
      .set(requirement)
      .where(eq(requirements.id, id))
      .returning();
    return result[0];
  }

  async deleteRequirement(id: string): Promise<boolean> {
    const result = await db.delete(requirements).where(eq(requirements.id, id)).returning();
    return result.length > 0;
  }

  // Fulfillment Plans
  async getFulfillmentPlans(requirementId: string): Promise<FulfillmentPlan[]> {
    return await db.select().from(fulfillmentPlans).where(eq(fulfillmentPlans.requirementId, requirementId));
  }

  async getAllFulfillmentPlans(): Promise<FulfillmentPlan[]> {
    return await db.select().from(fulfillmentPlans);
  }

  async getFulfillmentPlan(id: string): Promise<FulfillmentPlan | undefined> {
    const result = await db.select().from(fulfillmentPlans).where(eq(fulfillmentPlans.id, id));
    return result[0];
  }

  async createFulfillmentPlan(plan: InsertFulfillmentPlan): Promise<FulfillmentPlan> {
    const result = await db.insert(fulfillmentPlans).values(plan).returning();
    return result[0];
  }

  async updateFulfillmentPlan(id: string, plan: Partial<InsertFulfillmentPlan>): Promise<FulfillmentPlan | undefined> {
    const result = await db.update(fulfillmentPlans)
      .set(plan)
      .where(eq(fulfillmentPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteFulfillmentPlan(id: string): Promise<boolean> {
    const result = await db.delete(fulfillmentPlans).where(eq(fulfillmentPlans.id, id)).returning();
    return result.length > 0;
  }
  
  getStorageType(): string {
    return 'DatabaseStorage';
  }
}