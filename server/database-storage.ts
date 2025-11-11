import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { desc } from 'drizzle-orm';
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
      // Simple query to test connection - use a query that works even on empty tables
      await sql`SELECT 1`;
      console.log('Database connection test successful with HTTP');
      return true;
    } catch (error) {
      console.error('Database connection test failed with HTTP:', error);
      return false;
    }
  }

  // Configuration
  async getConfiguration(): Promise<Configuration | undefined> {
    try {
      const result = await db.select().from(configurations).limit(1);
      return result ? result[0] : undefined;
    } catch (error) {
      console.error('[DB] Error fetching configuration, returning undefined:', error);
      return undefined;
    }
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
    try {
      const result = await db.select().from(assets);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching assets, returning empty array:', error);
      return [];
    }
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
    try {
      const result = await db.select().from(vendors);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching vendors, returning empty array:', error);
      return [];
    }
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
    try {
      const result = await db.select().from(teamMembers);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching team members, returning empty array:', error);
      return [];
    }
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
    console.log('[DB] Fetching all expenses');
    try {
      const result = await db.select().from(expenses).orderBy(desc(expenses.created_at));
      console.log(`[DB] Successfully fetched ${result ? result.length : 0} expenses`);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching expenses, returning empty array:', error);
      return [];
    }
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    console.log(`[DB] Fetching expense with ID: ${id}`);
    try {
      const result = await db.select().from(expenses).where(eq(expenses.id, id));
      console.log(`[DB] Expense ${id} fetch result:`, result[0] ? 'Found' : 'Not found');
      return result[0];
    } catch (error) {
      console.error(`[DB] Error fetching expense ${id}:`, error);
      throw error;
    }
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    console.log('[DB] Creating new expense with data:', JSON.stringify(expense, null, 2));
    
    try {
      // Ensure required fields are present
      if (!expense.type || !expense.amount || !expense.date) {
        throw new Error('Missing required expense fields');
      }

      // Process the expense data for database insertion
      const processedExpense = {
        ...expense,
        // Ensure amount is a string for the database
        amount: (typeof expense.amount === 'number' 
          ? expense.amount 
          : expense.amount) as string,
        // Ensure date is in the correct format
        date: new Date(expense.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
        // Handle array fields with proper type conversion
        contributor: Array.isArray(expense.contributor) ? expense.contributor : [],
        contribution: (Array.isArray(expense.contribution) 
          ? expense.contribution.map(c => 
              typeof c === 'number' ? c.toString() : c
            ) 
          : []) as string[],
        contribution_status: (Array.isArray(expense.contribution_status) 
          ? expense.contribution_status 
          : []) as string[],
        // Ensure split_type is a string or null
        split_type: expense.split_type || null,
        // Set timestamps - using Date objects as expected by the database
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      console.log('[DB] Processed expense data:', JSON.stringify(processedExpense, null, 2));
      
      const result = await db.insert(expenses)
        .values(processedExpense)
        .returning();
        
      console.log('[DB] Successfully created expense:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] Error creating expense:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      throw error;
    }
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    console.log(`[DB] Updating expense ${id} with data:`, JSON.stringify(expense, null, 2));
    try {
      // Prepare the update object with only defined values
      const updateData: any = { ...expense };
      
      // Handle arrays properly, converting numbers to strings for the contribution field
      if ('contributor' in expense) {
        updateData.contributor = Array.isArray(expense.contributor) ? expense.contributor : [];
      }
      
      if ('contribution' in expense) {
        updateData.contribution = Array.isArray(expense.contribution) 
          ? expense.contribution.map(c => c.toString())
          : [];
      }
      
      if ('contribution_status' in expense) {
        updateData.contribution_status = Array.isArray(expense.contribution_status) 
          ? expense.contribution_status 
          : [];
      }
      
      const result = await db.update(expenses)
        .set(updateData)
        .where(eq(expenses.id, id))
        .returning();
        
      console.log(`[DB] Update result for expense ${id}:`, result[0] ? 'Success' : 'Not found');
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating expense ${id}:`, error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    console.log(`[DB] Deleting expense with ID: ${id}`);
    try {
      const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
      const success = result.length > 0;
      console.log(`[DB] Delete expense ${id} result:`, success ? 'Success' : 'Not found');
      return success;
    } catch (error) {
      console.error(`[DB] Error deleting expense ${id}:`, error);
      throw error;
    }
  }

  // Events
  async getEvents(): Promise<Event[]> {
    try {
      const result = await db.select().from(events);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching events, returning empty array:', error);
      return [];
    }
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Ensure registeredOn is properly formatted as YYYY-MM-DD string
    const eventData = {
      ...event,
      registeredOn: event.registeredOn ? new Date(event.registeredOn).toISOString().split('T')[0] : undefined
    };
    const result = await db.insert(events).values(eventData).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    // Create a new object to hold the update data
    const updateData: Partial<InsertEvent> = { ...event };
    
    // Convert registeredOn to Date object if it's being updated
    if (event.registeredOn !== undefined) {
      updateData.registeredOn = event.registeredOn instanceof Date 
        ? event.registeredOn 
        : new Date(event.registeredOn);
    }
      
    const result = await db.update(events)
      .set(updateData as any) // Type assertion needed due to drizzle-orm type complexity
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
    try {
      const result = await db.select().from(requirements).where(eq(requirements.eventId, eventId));
      return result || [];
    } catch (error) {
      console.error(`[DB] Error fetching requirements for event ${eventId}, returning empty array:`, error);
      return [];
    }
  }

  async getAllRequirements(): Promise<Requirement[]> {
    try {
      const result = await db.select().from(requirements);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching all requirements, returning empty array:', error);
      return [];
    }
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
    console.log('Updating requirement with data:', { id, requirement });
    try {
      // Explicitly include all possible fields to ensure nothing is missed
      const updateData = {
        requirement: requirement.requirement,
        description: requirement.description ?? '', // Ensure empty string if undefined
        requirementOwner: requirement.requirementOwner,
        requirementStatus: requirement.requirementStatus,
        price: requirement.price,
        quantity: requirement.quantity,
        order: requirement.order,
        // Don't update the eventId as it shouldn't change
      };
      
      const result = await db.update(requirements)
        .set(updateData)
        .where(eq(requirements.id, id))
        .returning();
        
      console.log('Update result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error updating requirement:', error);
      throw error;
    }
  }

  async deleteRequirement(id: string): Promise<boolean> {
    console.log('Database: Deleting requirement with ID:', id);
    try {
      const result = await db.delete(requirements).where(eq(requirements.id, id)).returning();
      console.log('Database: Delete result:', { deletedCount: result.length, id });
      return result.length > 0;
    } catch (error) {
      console.error('Database: Error deleting requirement:', error);
      throw error;
    }
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
    // Create a clean plan object with only the relevant fields
    const planData: any = {
      ...plan,
      // Clear fields that should be null based on plan type
      ...(plan.planType === 'Vendor' && {
        teamMemberId: null,
        teamRole: null,
        assetId: null,
        assetPurchaseStatus: null
      }),
      ...(plan.planType === 'Team' && {
        vendorId: null,
        assetId: null,
        assetPurchaseStatus: null
      }),
      ...(plan.planType === 'Asset' && {
        vendorId: null,
        teamMemberId: null,
        teamRole: null
      })
    };

    const result = await db.insert(fulfillmentPlans)
      .values(planData)
      .returning();
    return result[0];
  }

  async updateFulfillmentPlan(id: string, plan: Partial<InsertFulfillmentPlan>): Promise<FulfillmentPlan | undefined> {
    // Create a sanitized plan with proper type handling
    const updateData: Record<string, any> = { ...plan };
    
    // Handle payment field conversion
    if (plan.payment !== undefined) {
      updateData.payment = plan.payment !== null ? Number(plan.payment) : null;
    }
    
    // Remove undefined values to avoid overriding with null in the database
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await db.update(fulfillmentPlans)
      .set(updateData)
      .where(eq(fulfillmentPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteFulfillmentPlan(id: string): Promise<boolean> {
    console.log('Database: Deleting fulfillment plan with ID:', id);
    try {
      const result = await db.delete(fulfillmentPlans)
        .where(eq(fulfillmentPlans.id, id))
        .returning();
      
      console.log('Database: Fulfillment plan deletion result:', { 
        deletedCount: result.length,
        id,
        result 
      });
      
      return result.length > 0;
    } catch (error) {
      console.error('Database: Error deleting fulfillment plan:', error);
      throw error;
    }
  }
  
  getStorageType(): string {
    return 'DatabaseStorage';
  }
}