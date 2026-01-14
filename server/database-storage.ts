import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { desc } from 'drizzle-orm';
import {
  configurations,
  assets,
  vendors,
  teamMembers,
  expenses,
  expensesWithBalance,
  accountBalance,
  repayments,
  events,
  requirements,
  fulfillmentPlans,
  catalogItems,
  assetRentalRates,
  rentals,
  rentalItems,
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
  type AccountBalance,
  type InsertAccountBalance,
  type Repayment,
  type InsertRepayment,
  type Event,
  type InsertEvent,
  type Requirement,
  type InsertRequirement,
  type FulfillmentPlan,
  type InsertFulfillmentPlan,
  type CatalogItem,
  type InsertCatalogItem,
  type AssetRentalRate,
  type InsertAssetRentalRate,
  type Rental,
  type InsertRental,
  type RentalItem,
  type InsertRentalItem,
} from "@shared/schema";
import { eq } from 'drizzle-orm';
import { type IStorage } from './storage';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

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
      const result = await db.select().from(assets).orderBy(assets.name);
      // Ensure purchasedAmount is always a string for consistency
      return result.map(asset => ({
        ...asset,
        purchasedAmount: asset.purchasedAmount ? String(asset.purchasedAmount) : null
      }));
    } catch (error) {
      console.error('[DB] Error fetching assets, returning empty array:', error);
      return [];
    }
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const result = await db.select().from(assets).where(eq(assets.id, id));
    if (!result[0]) return undefined;
    
    // Ensure purchasedAmount is a string
    return {
      ...result[0],
      purchasedAmount: result[0].purchasedAmount ? String(result[0].purchasedAmount) : null
    };
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    // Ensure purchasedAmount is properly formatted as a string
    const purchasedAmount = asset.purchasedAmount !== undefined && asset.purchasedAmount !== null
      ? String(asset.purchasedAmount)
      : null;
      
    const assetData = {
      ...asset,
      purchasedAmount,
      // Ensure other fields have proper default values if needed
      quantity: asset.quantity ?? 1,
      status: asset.status || 'Active',
      purchaseDate: asset.purchaseDate || null,
      detailsAndUse: asset.detailsAndUse || null,
      warranty: asset.warranty || null,
    };
    
    const result = await db.insert(assets).values(assetData).returning();
    
    // Ensure purchasedAmount is a string in the returned object
    return {
      ...result[0],
      purchasedAmount: result[0].purchasedAmount ? String(result[0].purchasedAmount) : null
    };
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    // Prepare update data
    const updateData: any = { ...asset };
    
    // Only update purchasedAmount if it's provided
    if ('purchasedAmount' in asset) {
      updateData.purchasedAmount = asset.purchasedAmount !== undefined && asset.purchasedAmount !== null
        ? String(asset.purchasedAmount)
        : null;
    }
    
    const result = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
      
    if (!result.length) {
      return undefined;
    }
    
    // Ensure purchasedAmount is a string in the returned object
    return {
      ...result[0],
      purchasedAmount: result[0].purchasedAmount ? String(result[0].purchasedAmount) : null
    };
  }

  async deleteAsset(id: string): Promise<boolean> {
    // Check for linked fulfillment plans to avoid constraint violations
    const linkedPlans = await db
      .select({
        id: fulfillmentPlans.id,
        planType: fulfillmentPlans.planType,
        assetName: fulfillmentPlans.assetName,
      })
      .from(fulfillmentPlans)
      .where(eq(fulfillmentPlans.assetId, id));

    if (linkedPlans.length > 0) {
      const planDisplay = linkedPlans[0]?.assetName || linkedPlans[0]?.id;
      throw new Error(
        `Asset is linked with a fulfillment plan${planDisplay ? ` (${planDisplay})` : ''}`
      );
    }

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
    // Check for linked fulfillment plans to avoid constraint violations
    const linkedPlans = await db
      .select({
        id: fulfillmentPlans.id,
        planType: fulfillmentPlans.planType,
        planName: fulfillmentPlans.vendorCategory,
      })
      .from(fulfillmentPlans)
      .where(eq(fulfillmentPlans.vendorId, id));

    if (linkedPlans.length > 0) {
      const planDisplay = linkedPlans[0]?.planName || linkedPlans[0]?.id;
      throw new Error(
        `Vendor is linked with a fulfillment plan${planDisplay ? ` (${planDisplay})` : ''}`
      );
    }

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
    console.log('[DB] Fetching all expenses with closing balance from view');
    try {
      // Query the expenses_with_balance view to get running balance calculations
      const result = await db
        .select()
        .from(expensesWithBalance)
        .orderBy(desc(expensesWithBalance.date), desc(expensesWithBalance.created_at), desc(expensesWithBalance.id));
      
      console.log(`[DB] Successfully fetched ${result ? result.length : 0} expenses with closing balance`);
      // Map results to include assetId (which is not in the view but expected by Expense type)
      return result.map(row => ({ ...row, assetId: null }));
    } catch (error) {
      console.error('[DB] Error fetching expenses from view, returning empty array:', error);
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

  async getExpenseByEventId(eventId: string): Promise<Expense | undefined> {
    console.log(`[DB] Fetching expense by event ID: ${eventId}`);
    try {
      const result = await db.select().from(expenses).where(eq(expenses.eventId, eventId));
      console.log(`[DB] Expense for event ${eventId}:`, result[0] ? 'Found' : 'Not found');
      return result[0];
    } catch (error) {
      console.error(`[DB] Error fetching expense by event ${eventId}:`, error);
      throw error;
    }
  }

  async getExpensesByEventId(eventId: string): Promise<Expense[]> {
    console.log(`[DB] Fetching all expenses by event ID: ${eventId}`);
    try {
      const result = await db.select().from(expenses).where(eq(expenses.eventId, eventId));
      console.log(`[DB] Found ${result.length} expense(s) for event ${eventId}`);
      return result;
    } catch (error) {
      console.error(`[DB] Error fetching expenses by event ${eventId}:`, error);
      return [];
    }
  }

  async getExpenseByPlanId(planId: string): Promise<Expense | undefined> {
    console.log(`[DB] Fetching expense by plan ID: ${planId}`);
    try {
      const result = await db.select().from(expenses).where(eq(expenses.fulfillmentPlanId, planId));
      console.log(`[DB] Expense for plan ${planId}:`, result[0] ? 'Found' : 'Not found');
      return result[0];
    } catch (error) {
      console.error(`[DB] Error fetching expense by plan ${planId}:`, error);
      throw error;
    }
  }

  async getExpensesByPlanId(planId: string): Promise<Expense[]> {
    console.log(`[DB] Fetching all expenses by plan ID: ${planId}`);
    try {
      const result = await db.select().from(expenses).where(eq(expenses.fulfillmentPlanId, planId));
      console.log(`[DB] Found ${result.length} expense(s) for plan ${planId}`);
      return result;
    } catch (error) {
      console.error(`[DB] Error fetching expenses by plan ${planId}:`, error);
      return [];
    }
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    console.log('[DB] Creating new expense with data:', JSON.stringify(expense, null, 2));
    
    try {
      // Ensure required fields are present
      if (!expense.type || !expense.amount || !expense.date) {
        throw new Error('Missing required expense fields');
      }

      // Explicitly define the fields we want to insert
      const insertData = {
        type: expense.type,
        category: expense.category || 'Event',
        from_account: expense.from_account || 'DDC Fund',
        to_account: expense.to_account || null,
        description: expense.description || null,
        amount: (() => {
          const numAmount = typeof expense.amount === 'number' ? expense.amount : Number(expense.amount);
          return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
        })(),
        date: new Date(expense.date).toISOString().split('T')[0],
        status: expense.status || 'Pending',
        split_type: expense.split_type || null,
        contributor: Array.isArray(expense.contributor) ? expense.contributor : [],
        contribution: Array.isArray(expense.contribution) 
          ? expense.contribution.map(c => (typeof c === 'number' ? c.toString() : c)) 
          : [],
        contribution_status: Array.isArray(expense.contribution_status) 
          ? expense.contribution_status 
          : [],
        created_at: new Date(),
        updated_at: new Date(),
        eventId: expense.eventId || null,
        fulfillmentPlanId: expense.fulfillmentPlanId || null,
      };
      
      console.log('[DB] Processed expense data for insert:', JSON.stringify(insertData, null, 2));
      
      const result = await db.insert(expenses)
        .values(insertData)
        .returning();
        
      console.log('[DB] Successfully created expense:', result[0]);
      
      // Update account balance based on transaction type
      const balanceUpdateAmount = Number(expense.amount);
      console.log(`[DB] Processing balance update for transaction type: ${expense.type}, amount: ${balanceUpdateAmount}`);
      
      switch (expense.type) {
        case 'Credit':
          // Add amount to balance
          await this.updateAccountBalanceAmount(balanceUpdateAmount);
          break;
        case 'Debit':
          // Subtract amount from balance
          await this.updateAccountBalanceAmount(-balanceUpdateAmount);
          break;
        case 'Transfer':
          if (expense.from_account === 'DDC Fund') {
            // Subtract amount from balance
            await this.updateAccountBalanceAmount(-balanceUpdateAmount);
          } else if (expense.to_account === 'DDC Fund') {
            // Add amount to balance
            await this.updateAccountBalanceAmount(balanceUpdateAmount);
          }
          // Update repayment records for Transfer transactions
          await this.updateRepaymentForTransfer(expense);
          break;
      }
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
      // First, get the existing expense to compare changes
      const existingExpenses = await db.select().from(expenses).where(eq(expenses.id, id));
      if (existingExpenses.length === 0) {
        console.log(`[DB] Expense ${id} not found`);
        return undefined;
      }
      const existing = existingExpenses[0];
      
      // Store old values for balance/repayment adjustments
      const oldType = existing.type;
      const oldAmount = Number(existing.amount);
      const oldFromAccount = existing.from_account;
      const oldToAccount = existing.to_account;
      
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
      
      // Update the expense
      const result = await db.update(expenses)
        .set({ ...updateData, updated_at: new Date() })
        .where(eq(expenses.id, id))
        .returning();
        
      console.log(`[DB] Update result for expense ${id}:`, result[0] ? 'Success' : 'Not found');
      
      if (result[0]) {
        // Get new values
        const newType = expense.type || oldType;
        const newAmount = expense.amount ? Number(expense.amount) : oldAmount;
        const newFromAccount = expense.from_account || oldFromAccount;
        const newToAccount = expense.to_account || oldToAccount;
        
        // Revert the old transaction's effect on balance
        await this.revertTransactionEffect(oldType, oldAmount, oldFromAccount, oldToAccount);
        
        // Apply the new transaction's effect on balance
        await this.applyTransactionEffect(newType, newAmount, newFromAccount, newToAccount, result[0]);
      }
      
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating expense ${id}:`, error);
      throw error;
    }
  }

  // Helper to revert transaction effects
  private async revertTransactionEffect(type: string, amount: number, fromAccount: string, toAccount: string | null): Promise<void> {
    console.log(`[DB] Reverting transaction effect: type=${type}, amount=${amount}`);
    try {
      switch (type) {
        case 'Credit':
          // Subtract the amount that was added
          await this.updateAccountBalanceAmount(-amount);
          break;
        case 'Debit':
          // Add back the amount that was subtracted
          await this.updateAccountBalanceAmount(amount);
          break;
        case 'Transfer':
          if (fromAccount === 'DDC Fund') {
            // Add back the amount that was subtracted
            await this.updateAccountBalanceAmount(amount);
          } else if (toAccount === 'DDC Fund') {
            // Subtract the amount that was added
            await this.updateAccountBalanceAmount(-amount);
          }
          // Revert repayment changes
          await this.revertRepaymentEffect(type, amount, fromAccount, toAccount);
          break;
      }
    } catch (error) {
      console.error('[DB] Error reverting transaction effect:', error);
      throw error;
    }
  }

  // Helper to apply transaction effects
  private async applyTransactionEffect(type: string, amount: number, fromAccount: string, toAccount: string | null, expense: Expense): Promise<void> {
    console.log(`[DB] Applying transaction effect: type=${type}, amount=${amount}`);
    try {
      switch (type) {
        case 'Credit':
          // Add amount to balance
          await this.updateAccountBalanceAmount(amount);
          break;
        case 'Debit':
          // Subtract amount from balance
          await this.updateAccountBalanceAmount(-amount);
          break;
        case 'Transfer':
          if (fromAccount === 'DDC Fund') {
            // Subtract amount from balance
            await this.updateAccountBalanceAmount(-amount);
          } else if (toAccount === 'DDC Fund') {
            // Add amount to balance
            await this.updateAccountBalanceAmount(amount);
          }
          // Update repayment records
          await this.updateRepaymentForTransfer({
            type: expense.type,
            amount: expense.amount,
            from_account: expense.from_account,
            to_account: expense.to_account,
            date: new Date(expense.date),
            contributor: [],
            contribution: [],
            contribution_status: [],
          });
          break;
      }
    } catch (error) {
      console.error('[DB] Error applying transaction effect:', error);
      throw error;
    }
  }

  // Helper to revert repayment effects
  private async revertRepaymentEffect(type: string, amount: number, fromAccount: string, toAccount: string | null): Promise<void> {
    console.log(`[DB] Reverting repayment effect: type=${type}, amount=${amount}`);
    try {
      if (type === 'Transfer' && toAccount === 'DDC Fund' && fromAccount) {
        // Revert CASE 1: Transfer to DDC Fund
        const sourceName = fromAccount;
        const existingRepayment = await db.select().from(repayments).where(eq(repayments.source_name, sourceName));
        
        if (existingRepayment.length > 0) {
          const repayment = existingRepayment[0];
          const currentAllocated = Number(repayment.allocated_amount);
          const currentPending = Number(repayment.pending_amount);
          
          if (currentAllocated > amount) {
            await db.update(repayments)
              .set({
                allocated_amount: String(currentAllocated - amount),
                pending_amount: String(currentPending - amount),
              })
              .where(eq(repayments.id, repayment.id));
          } else {
            // Remove the record if allocation becomes zero
            await db.delete(repayments).where(eq(repayments.id, repayment.id));
          }
        }
      } else if (type === 'Transfer' && fromAccount === 'DDC Fund' && toAccount) {
        // Revert CASE 2: Transfer from DDC Fund
        const sourceName = toAccount;
        const existingRepayment = await db.select().from(repayments).where(eq(repayments.source_name, sourceName));
        
        if (existingRepayment.length > 0) {
          const repayment = existingRepayment[0];
          const currentRepaid = Number(repayment.repaid_amount);
          const currentAllocated = Number(repayment.allocated_amount);
          
          const newRepaidAmount = Math.max(0, currentRepaid - amount);
          const newPendingAmount = currentAllocated - newRepaidAmount;
          
          await db.update(repayments)
            .set({
              repaid_amount: String(newRepaidAmount),
              pending_amount: String(newPendingAmount),
            })
            .where(eq(repayments.id, repayment.id));
        }
      }
    } catch (error) {
      console.error('[DB] Error reverting repayment effect:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    console.log(`[DB] Deleting expense with ID: ${id}`);
    try {
      // First, get the existing expense to retrieve its details
      const existingExpenses = await db.select().from(expenses).where(eq(expenses.id, id));
      if (existingExpenses.length === 0) {
        console.log(`[DB] Expense ${id} not found`);
        return false;
      }
      
      const existing = existingExpenses[0];
      const type = existing.type;
      const amount = Number(existing.amount);
      const fromAccount = existing.from_account;
      const toAccount = existing.to_account;
      
      console.log(`[DB] Expense details before deletion: type=${type}, amount=${amount}, from=${fromAccount}, to=${toAccount}`);
      
      // Revert the transaction's effect on balance and repayment
      await this.revertTransactionEffect(type, amount, fromAccount, toAccount);
      
      // Now delete the expense
      const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
      const success = result.length > 0;
      console.log(`[DB] Delete expense ${id} result:`, success ? 'Success' : 'Not found');
      return success;
    } catch (error) {
      console.error(`[DB] Error deleting expense ${id}:`, error);
      throw error;
    }
  }

  // Account Balance CRUD operations
  async getAccountBalance(): Promise<AccountBalance[]> {
    console.log('[DB] Fetching all account balances');
    try {
      const result = await db.select().from(accountBalance);
      console.log(`[DB] Found ${result.length} account balances`);
      return result;
    } catch (error) {
      console.error('[DB] Error fetching account balances:', error);
      throw error;
    }
  }

  async getAccountBalanceById(id: number): Promise<AccountBalance | undefined> {
    console.log(`[DB] Fetching account balance with ID: ${id}`);
    try {
      const result = await db.select().from(accountBalance).where(eq(accountBalance.id, id));
      return result[0];
    } catch (error) {
      console.error(`[DB] Error fetching account balance ${id}:`, error);
      throw error;
    }
  }

  async createAccountBalance(balance: InsertAccountBalance): Promise<AccountBalance> {
    console.log('[DB] Creating new account balance:', JSON.stringify(balance, null, 2));
    try {
      const result = await db.insert(accountBalance).values({
        name: balance.name || 'DDC Fund',
        balance: String(typeof balance.balance === 'number' ? balance.balance : Number(balance.balance) || 0),
      }).returning();
      
      console.log('[DB] Account balance created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] Error creating account balance:', error);
      throw error;
    }
  }

  async updateAccountBalance(id: number, balance: Partial<InsertAccountBalance>): Promise<AccountBalance | undefined> {
    console.log(`[DB] Updating account balance ${id} with data:`, JSON.stringify(balance, null, 2));
    try {
      const updateData: any = {};
      
      if (balance.name !== undefined) {
        updateData.name = balance.name;
      }
      
      if (balance.balance !== undefined) {
        updateData.balance = String(typeof balance.balance === 'number' ? balance.balance : Number(balance.balance) || 0);
      }
      
      const result = await db
        .update(accountBalance)
        .set(updateData)
        .where(eq(accountBalance.id, id))
        .returning();
      
      if (result.length === 0) {
        console.log(`[DB] Account balance ${id} not found for update`);
        return undefined;
      }
      
      console.log('[DB] Account balance updated successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating account balance ${id}:`, error);
      throw error;
    }
  }

  async deleteAccountBalance(id: number): Promise<boolean> {
    console.log(`[DB] Deleting account balance with ID: ${id}`);
    try {
      const result = await db.delete(accountBalance).where(eq(accountBalance.id, id)).returning();
      const success = result.length > 0;
      console.log(`[DB] Delete account balance ${id} result:`, success ? 'Success' : 'Not found');
      return success;
    } catch (error) {
      console.error(`[DB] Error deleting account balance ${id}:`, error);
      throw error;
    }
  }

  // Repayments CRUD operations
  async getRepayments(): Promise<Repayment[]> {
    console.log('[DB] Fetching all repayments');
    try {
      const result = await db.select().from(repayments) as Repayment[];
      console.log(`[DB] Found ${result.length} repayments`);
      return result;
    } catch (error) {
      console.error('[DB] Error fetching repayments:', error);
      throw error;
    }
  }

  async getRepayment(id: number): Promise<Repayment | undefined> {
    console.log(`[DB] Fetching repayment with ID: ${id}`);
    try {
      const result = await db.select().from(repayments).where(eq(repayments.id, id));
      return result[0];
    } catch (error) {
      console.error(`[DB] Error fetching repayment ${id}:`, error);
      throw error;
    }
  }

  async createRepayment(repayment: InsertRepayment): Promise<Repayment> {
    console.log('[DB] Creating new repayment:', JSON.stringify(repayment, null, 2));
    try {
      const result = await db.insert(repayments).values({
        source_name: repayment.source_name,
        allocated_amount: String(typeof repayment.allocated_amount === 'number' 
          ? repayment.allocated_amount 
          : Number(repayment.allocated_amount) || 0),
        repaid_amount: String(typeof repayment.repaid_amount === 'number' 
          ? repayment.repaid_amount 
          : Number(repayment.repaid_amount) || 0),
        pending_amount: String(typeof repayment.pending_amount === 'number' 
          ? repayment.pending_amount 
          : Number(repayment.pending_amount) || 0),
      }).returning();
      
      console.log('[DB] Repayment created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('[DB] Error creating repayment:', error);
      throw error;
    }
  }

  async updateRepayment(id: number, repayment: Partial<InsertRepayment>): Promise<Repayment | undefined> {
    console.log(`[DB] Updating repayment ${id} with data:`, JSON.stringify(repayment, null, 2));
    try {
      const updateData: any = {};
      
      if (repayment.source_name !== undefined) {
        updateData.source_name = repayment.source_name;
      }
      
      if (repayment.allocated_amount !== undefined) {
        updateData.allocated_amount = String(typeof repayment.allocated_amount === 'number' 
          ? repayment.allocated_amount 
          : Number(repayment.allocated_amount) || 0);
      }
      
      if (repayment.repaid_amount !== undefined) {
        updateData.repaid_amount = String(typeof repayment.repaid_amount === 'number' 
          ? repayment.repaid_amount 
          : Number(repayment.repaid_amount) || 0);
      }
      
      if (repayment.pending_amount !== undefined) {
        updateData.pending_amount = String(typeof repayment.pending_amount === 'number' 
          ? repayment.pending_amount 
          : Number(repayment.pending_amount) || 0);
      }
      
      const result = await db
        .update(repayments)
        .set(updateData)
        .where(eq(repayments.id, id))
        .returning();
      
      if (result.length === 0) {
        console.log(`[DB] Repayment ${id} not found for update`);
        return undefined;
      }
      
      console.log('[DB] Repayment updated successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating repayment ${id}:`, error);
      throw error;
    }
  }

  async deleteRepayment(id: number): Promise<boolean> {
    console.log(`[DB] Deleting repayment with ID: ${id}`);
    try {
      const result = await db.delete(repayments).where(eq(repayments.id, id)).returning();
      const success = result.length > 0;
      console.log(`[DB] Delete repayment ${id} result:`, success ? 'Success' : 'Not found');
      return success;
    } catch (error) {
      console.error(`[DB] Error deleting repayment ${id}:`, error);
      throw error;
    }
  }

  private async updateRepaymentForTransfer(expense: InsertExpense): Promise<void> {
    const amount = Number(expense.amount);
    console.log(`[DB] Updating repayment for transfer: type=${expense.type}, amount=${amount}, from=${expense.from_account}, to=${expense.to_account}`);
    
    try {
      if (expense.type === 'Transfer' && expense.to_account === 'DDC Fund' && expense.from_account) {
        // CASE 1: Transfer to DDC Fund - add or update repayment record
        const sourceName = expense.from_account;
        const existingRepayment = await db.select().from(repayments).where(eq(repayments.source_name, sourceName));
        
        if (existingRepayment.length > 0) {
          // Update existing record
          const repayment = existingRepayment[0];
          const currentAllocated = Number(repayment.allocated_amount);
          const currentPending = Number(repayment.pending_amount);
          
          await db.update(repayments)
            .set({
              allocated_amount: String(currentAllocated + amount),
              pending_amount: String(currentPending + amount),
            })
            .where(eq(repayments.id, repayment.id));
        } else {
          // Create new record
          await db.insert(repayments).values({
            source_name: sourceName,
            allocated_amount: String(amount),
            repaid_amount: '0',
            pending_amount: String(amount),
          });
        }
      } else if (expense.type === 'Transfer' && expense.from_account === 'DDC Fund' && expense.to_account) {
        // CASE 2: Transfer from DDC Fund - update repayment record
        const sourceName = expense.to_account;
        const existingRepayment = await db.select().from(repayments).where(eq(repayments.source_name, sourceName));
        
        if (existingRepayment.length > 0) {
          // Update existing record
          const repayment = existingRepayment[0];
          const currentRepaid = Number(repayment.repaid_amount);
          const currentAllocated = Number(repayment.allocated_amount);
          
          const newRepaidAmount = currentRepaid + amount;
          const newPendingAmount = currentAllocated - newRepaidAmount;
          
          await db.update(repayments)
            .set({
              repaid_amount: String(newRepaidAmount),
              pending_amount: String(newPendingAmount),
            })
            .where(eq(repayments.id, repayment.id));
        }
      }
    } catch (error) {
      console.error('[DB] Error updating repayment for transfer:', error);
      throw error;
    }
  }

  // Helper method to get current account balance
  private async getCurrentAccountBalance(): Promise<number> {
    try {
      const balances = await db.select().from(accountBalance).limit(1);
      
      if (balances.length === 0) {
        // Return 0 if no balance record exists
        return 0;
      } else {
        return Number(balances[0].balance);
      }
    } catch (error) {
      console.error('[DB] Error getting current account balance:', error);
      return 0;
    }
  }

  // Helper method to update account balance
  private async updateAccountBalanceAmount(amount: number): Promise<void> {
    console.log(`[DB] Updating account balance by amount: ${amount}`);
    try {
      // Get the first (and only) account balance record
      const balances = await db.select().from(accountBalance).limit(1);
      
      if (balances.length === 0) {
        // Create initial record if none exists
        console.log('[DB] Creating initial account balance record');
        await db.insert(accountBalance).values({
          name: 'DDC Fund',
          balance: String(amount),
        });
      } else {
        // Update the existing record
        const existingBalance = balances[0];
        const currentBalance = Number(existingBalance.balance);
        const newBalance = currentBalance + amount;
        console.log(`[DB] Updating balance from ${currentBalance} to ${newBalance}`);
        
        await db
          .update(accountBalance)
          .set({ balance: String(newBalance) })
          .where(eq(accountBalance.id, existingBalance.id));
      }
    } catch (error) {
      console.error('[DB] Error updating account balance:', error);
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
    
    // Convert registeredOn to YYYY-MM-DD string if it's being updated
    if (event.registeredOn !== undefined) {
      if (event.registeredOn === null) {
        updateData.registeredOn = undefined; // Keep existing value in database
      } else {
        let date: Date;
        if (Object.prototype.toString.call(event.registeredOn) === '[object Date]') {
          date = event.registeredOn as Date;
        } else {
          date = new Date(event.registeredOn as string);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date format for registeredOn');
          }
        }
        updateData.registeredOn = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
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
      // Build update data dynamically, only including fields that are provided
      const updateData: Record<string, any> = {};
      
      if (requirement.requirement !== undefined) updateData.requirement = requirement.requirement;
      if (requirement.description !== undefined) updateData.description = requirement.description;
      if (requirement.requirementOwner !== undefined) updateData.requirementOwner = requirement.requirementOwner;
      if (requirement.requirementStatus !== undefined) updateData.requirementStatus = requirement.requirementStatus;
      if (requirement.price !== undefined) updateData.price = requirement.price;
      if (requirement.quantity !== undefined) updateData.quantity = requirement.quantity;
      if (requirement.order !== undefined) updateData.order = requirement.order;
      if (requirement.req_discount !== undefined) updateData.req_discount = requirement.req_discount;
      if (requirement.req_discount_amount !== undefined) updateData.req_discount_amount = requirement.req_discount_amount;
      if (requirement.images !== undefined) updateData.images = requirement.images;
      
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
    try {
      const result = await db.select().from(fulfillmentPlans);
      return result || [];
    } catch (error) {
      console.error('[DB] Error fetching all fulfillment plans, returning empty array:', error);
      return [];
    }
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
        assetPurchaseStatus: null,
        assetType: null
      }),
      ...(plan.planType === 'Team' && {
        vendorId: null,
        assetId: null,
        assetPurchaseStatus: null,
        assetType: null
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

  // Catalog Items
  async getCatalogItems(): Promise<CatalogItem[]> {
    try {
      const result = await db.select().from(catalogItems).orderBy(catalogItems.serviceType, catalogItems.package);
      return result;
    } catch (error) {
      console.error('[DB] Error fetching catalog items:', error);
      return [];
    }
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    try {
      const result = await db.select().from(catalogItems).where(eq(catalogItems.id, id));
      return result[0];
    } catch (error) {
      console.error('[DB] Error fetching catalog item:', error);
      return undefined;
    }
  }

  async getCatalogItemsByService(serviceType: string): Promise<CatalogItem[]> {
    try {
      const result = await db.select().from(catalogItems)
        .where(eq(catalogItems.serviceType, serviceType))
        .orderBy(catalogItems.package);
      return result;
    } catch (error) {
      console.error('[DB] Error fetching catalog items by service:', error);
      return [];
    }
  }

  async getCatalogItemsByPackage(packageName: string): Promise<CatalogItem[]> {
    try {
      const result = await db.select().from(catalogItems)
        .where(eq(catalogItems.package, packageName))
        .orderBy(catalogItems.serviceType);
      return result;
    } catch (error) {
      console.error('[DB] Error fetching catalog items by package:', error);
      return [];
    }
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const result = await db.insert(catalogItems).values({
      serviceType: item.serviceType,
      package: item.package,
      itemName: item.itemName,
      description: item.description || null,
      price: item.price || '0',
    }).returning();
    return result[0];
  }

  async updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined> {
    const updateData: Record<string, any> = { ...item };
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await db.update(catalogItems)
      .set(updateData)
      .where(eq(catalogItems.id, id))
      .returning();
    return result[0];
  }

  async deleteCatalogItem(id: string): Promise<boolean> {
    try {
      const result = await db.delete(catalogItems)
        .where(eq(catalogItems.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('[DB] Error deleting catalog item:', error);
      return false;
    }
  }

  // Asset Rental Rates
  async getAssetRentalRates(): Promise<AssetRentalRate[]> {
    return await db.select().from(assetRentalRates);
  }

  async getAssetRentalRate(id: string): Promise<AssetRentalRate | undefined> {
    const result = await db.select().from(assetRentalRates).where(eq(assetRentalRates.id, id));
    return result[0];
  }

  async getAssetRentalRatesByAsset(assetId: string): Promise<AssetRentalRate[]> {
    return await db.select().from(assetRentalRates).where(eq(assetRentalRates.assetId, assetId));
  }

  async createAssetRentalRate(rate: InsertAssetRentalRate): Promise<AssetRentalRate> {
    const result = await db.insert(assetRentalRates).values({
      assetId: rate.assetId,
      duration: rate.duration,
      timeUnit: rate.timeUnit,
      amount: rate.amount || '0',
    }).returning();
    return result[0];
  }

  async updateAssetRentalRate(id: string, rate: Partial<InsertAssetRentalRate>): Promise<AssetRentalRate | undefined> {
    const updateData: Record<string, any> = { ...rate, updatedAt: new Date() };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });
    const result = await db.update(assetRentalRates).set(updateData).where(eq(assetRentalRates.id, id)).returning();
    return result[0];
  }

  async deleteAssetRentalRate(id: string): Promise<boolean> {
    try {
      const result = await db.delete(assetRentalRates).where(eq(assetRentalRates.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('[DB] Error deleting asset rental rate:', error);
      return false;
    }
  }

  // Rentals
  async getRentals(): Promise<Rental[]> {
    return await db.select().from(rentals).orderBy(desc(rentals.createdAt));
  }

  async getRental(id: string): Promise<Rental | undefined> {
    const result = await db.select().from(rentals).where(eq(rentals.id, id));
    return result[0];
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const result = await db.insert(rentals).values({
      customerName: rental.customerName,
      customerPhone: rental.customerPhone || null,
      customerEmail: rental.customerEmail || null,
      customerAddress: rental.customerAddress || null,
      rentalDate: rental.rentalDate instanceof Date ? rental.rentalDate.toISOString().split('T')[0] : rental.rentalDate,
      returnDate: rental.returnDate instanceof Date ? rental.returnDate.toISOString().split('T')[0] : rental.returnDate || null,
      status: rental.status || 'Quote',
      paymentStatus: rental.paymentStatus || 'Pending',
      paymentMode: rental.paymentMode || null,
      notes: rental.notes || null,
      totalAmount: rental.totalAmount || '0',
      discount: rental.discount || 'false',
      discountAmount: rental.discountAmount || '0',
    }).returning();
    return result[0];
  }

  async updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined> {
    const updateData: Record<string, any> = { ...rental, updatedAt: new Date() };
    
    // Handle date conversions
    if (rental.rentalDate) {
      updateData.rentalDate = rental.rentalDate instanceof Date 
        ? rental.rentalDate.toISOString().split('T')[0] 
        : rental.rentalDate;
    }
    if (rental.returnDate !== undefined) {
      updateData.returnDate = rental.returnDate instanceof Date 
        ? rental.returnDate.toISOString().split('T')[0] 
        : rental.returnDate;
    }
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });
    
    const result = await db.update(rentals).set(updateData).where(eq(rentals.id, id)).returning();
    return result[0];
  }

  async deleteRental(id: string): Promise<boolean> {
    try {
      // Cascade will delete rental items automatically
      const result = await db.delete(rentals).where(eq(rentals.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('[DB] Error deleting rental:', error);
      return false;
    }
  }

  // Rental Items
  async getRentalItems(rentalId: string): Promise<RentalItem[]> {
    return await db.select().from(rentalItems).where(eq(rentalItems.rentalId, rentalId));
  }

  async getRentalItem(id: string): Promise<RentalItem | undefined> {
    const result = await db.select().from(rentalItems).where(eq(rentalItems.id, id));
    return result[0];
  }

  async createRentalItem(item: InsertRentalItem): Promise<RentalItem> {
    const result = await db.insert(rentalItems).values({
      rentalId: item.rentalId,
      assetId: item.assetId,
      quantity: item.quantity || 1,
      duration: item.duration,
      timeUnit: item.timeUnit,
      ratePerUnit: item.ratePerUnit || '0',
      totalAmount: item.totalAmount || '0',
    }).returning();
    return result[0];
  }

  async updateRentalItem(id: string, item: Partial<InsertRentalItem>): Promise<RentalItem | undefined> {
    const updateData: Record<string, any> = { ...item };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });
    const result = await db.update(rentalItems).set(updateData).where(eq(rentalItems.id, id)).returning();
    return result[0];
  }

  async deleteRentalItem(id: string): Promise<boolean> {
    try {
      const result = await db.delete(rentalItems).where(eq(rentalItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('[DB] Error deleting rental item:', error);
      return false;
    }
  }
  
  getStorageType(): string {
    return 'DatabaseStorage';
  }
}