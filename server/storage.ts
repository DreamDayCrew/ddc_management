import {
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
  type AccountBalance,
  type InsertAccountBalance,
  type Repayment,
  type InsertRepayment,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Configuration
  getConfiguration(): Promise<Configuration | undefined>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(id: string, config: Partial<InsertConfiguration>): Promise<Configuration | undefined>;

  // Assets
  getAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Account Balance
  getAccountBalance(): Promise<AccountBalance[]>;
  getAccountBalanceById(id: number): Promise<AccountBalance | undefined>;
  createAccountBalance(balance: InsertAccountBalance): Promise<AccountBalance>;
  updateAccountBalance(id: number, balance: Partial<InsertAccountBalance>): Promise<AccountBalance | undefined>;
  deleteAccountBalance(id: number): Promise<boolean>;

  // Repayments
  getRepayments(): Promise<Repayment[]>;
  getRepayment(id: number): Promise<Repayment | undefined>;
  createRepayment(repayment: InsertRepayment): Promise<Repayment>;
  updateRepayment(id: number, repayment: Partial<InsertRepayment>): Promise<Repayment | undefined>;
  deleteRepayment(id: number): Promise<boolean>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Requirements
  getAllRequirements(): Promise<Requirement[]>;
  getRequirements(eventId: string): Promise<Requirement[]>;
  getRequirement(id: string): Promise<Requirement | undefined>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined>;
  deleteRequirement(id: string): Promise<boolean>;

  // Fulfillment Plans
  getAllFulfillmentPlans(): Promise<FulfillmentPlan[]>;
  getFulfillmentPlans(requirementId: string): Promise<FulfillmentPlan[]>;
  getFulfillmentPlan(id: string): Promise<FulfillmentPlan | undefined>;
  createFulfillmentPlan(plan: InsertFulfillmentPlan): Promise<FulfillmentPlan>;
  updateFulfillmentPlan(id: string, plan: Partial<InsertFulfillmentPlan>): Promise<FulfillmentPlan | undefined>;
  deleteFulfillmentPlan(id: string): Promise<boolean>;
  
  // Debug method
  getStorageType(): string;
}

export class MemStorage implements IStorage {
  private configuration: Configuration | null = null;
  private assets: Map<string, Asset> = new Map();
  private vendors: Map<string, Vendor> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private events: Map<string, Event> = new Map();
  private requirements: Map<string, Requirement> = new Map();
  private fulfillmentPlans: Map<string, FulfillmentPlan> = new Map();
  private accountBalance: Map<number, AccountBalance> = new Map();
  private repayments: Map<number, Repayment> = new Map();
  private currentAccountBalanceId: number = 1;
  private currentRepaymentId: number = 1;

  // Configuration
  async getConfiguration(): Promise<Configuration | undefined> {
    return this.configuration || undefined;
  }

  async createConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const newConfig: Configuration = { 
      id: randomUUID(),
      businessName: config.businessName,
      logo: config.logo || null,
      gstNumber: config.gstNumber || null,
      includeGst: config.includeGst || null,
      address: config.address || null,
      phone: config.phone || null,
      email: config.email || null,
      website: config.website || null,
      socialLinks: config.socialLinks || null,
      termsAndConditions: config.termsAndConditions || null,
      signatureImage: config.signatureImage || null,
      assetCategories: config.assetCategories || ['Audio System','Decoration','Furniture','Photography','Lighting','Stage Equipment','Electrical / Wires','Office use / Safety'],
      assetPurchaseStatus: config.assetPurchaseStatus || ['Existing', 'New'],
      servicesProvided: config.servicesProvided || ['Wedding Planning & Décor','Engagements & Receptions','Birthday & Anniversary Celebrations','Corporate Events & Launchs','Cultural & Theme Events','Marathons, carnivals, stage plays, and non-profit initiatives','Service & Installation','Devotional events'],
      investmentTypes: config.investmentTypes || ['Office','Equipment','Marketing','Inventory'],
      planStatuses: config.planStatuses || ['To Do','In Progress','Completed','Blocker'],
      roles: config.roles || ['Designer','Coordinator','Manager','Technical Support','Decorator','Logistics','Purchasing Items'],
      paymentModes: config.paymentModes || ['Cash','Bank Transfer','UPI'],
      paymentStatuses: config.paymentStatuses || ['Pending', 'Paid','Partial'],
      vendorCategories: config.vendorCategories || ['Decoration','Photography','Catering','Audio/Visual','Venue','Transportation','Lightings'],
      expenseCategories: config.expenseCategories || ['Office','Event','Asset'],
    };
    this.configuration = newConfig;
    return newConfig;
  }

  async updateConfiguration(id: string, config: Partial<InsertConfiguration>): Promise<Configuration | undefined> {
    if (!this.configuration || this.configuration.id !== id) return undefined;
    this.configuration = { ...this.configuration, ...config };
    return this.configuration;
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    // Return a new array with copies of the assets to prevent direct modification
    return Array.from(this.assets.values()).map(asset => ({
      ...asset,
      // Ensure purchasedAmount is a string
      purchasedAmount: asset.purchasedAmount ? String(asset.purchasedAmount) : null
    }));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    
    // Return a copy with purchasedAmount as string
    return {
      ...asset,
      purchasedAmount: asset.purchasedAmount ? String(asset.purchasedAmount) : null
    };
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    // Ensure purchasedAmount is properly formatted as a string
    const purchasedAmount = asset.purchasedAmount !== undefined && asset.purchasedAmount !== null
      ? String(asset.purchasedAmount)
      : null;
      
    const newAsset: Asset = { 
      id: randomUUID(),
      name: asset.name,
      category: asset.category,
      quantity: asset.quantity ?? 1,
      purchaseDate: asset.purchaseDate || null,
      purchasedAmount: purchasedAmount,
      status: asset.status || 'Active',
      detailsAndUse: asset.detailsAndUse || null,
      warranty: asset.warranty || null,
    };
    
    this.assets.set(newAsset.id, newAsset);
    return { ...newAsset }; // Return a copy to prevent direct modification
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const existing = this.assets.get(id);
    if (!existing) return undefined;
    
    // Create a new object with the updated values
    const updated: Asset = { ...existing };
    
    // Update only the provided fields
    if (asset.name !== undefined) updated.name = asset.name;
    if (asset.category !== undefined) updated.category = asset.category;
    if (asset.quantity !== undefined) updated.quantity = asset.quantity;
    if (asset.purchaseDate !== undefined) updated.purchaseDate = asset.purchaseDate;
    if (asset.status !== undefined) updated.status = asset.status;
    if (asset.detailsAndUse !== undefined) updated.detailsAndUse = asset.detailsAndUse;
    if (asset.warranty !== undefined) updated.warranty = asset.warranty;
    
    // Handle purchasedAmount separately to ensure it's a string
    if ('purchasedAmount' in asset) {
      updated.purchasedAmount = asset.purchasedAmount !== undefined && asset.purchasedAmount !== null
        ? String(asset.purchasedAmount)
        : null;
    }
    
    this.assets.set(id, updated);
    return { ...updated }; // Return a copy to prevent direct modification
  }

  async deleteAsset(id: string): Promise<boolean> {
    return this.assets.delete(id);
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const newVendor: Vendor = { 
      id: randomUUID(),
      name: vendor.name,
      category: vendor.category || null,
      specialization: vendor.specialization || null,
      location: vendor.location || null,
      contactInfo: vendor.contactInfo || null,
      rating: vendor.rating ?? null,
    };
    this.vendors.set(newVendor.id, newVendor);
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const existing = this.vendors.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...vendor };
    this.vendors.set(id, updated);
    return updated;
  }

  async deleteVendor(id: string): Promise<boolean> {
    return this.vendors.delete(id);
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const newMember: TeamMember = { ...member, id: randomUUID() };
    this.teamMembers.set(newMember.id, newMember);
    return newMember;
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const existing = this.teamMembers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...member };
    this.teamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    // Ensure contribution is an array of numbers and handle null/undefined cases
    const contribution = Array.isArray(expense.contribution)
      ? expense.contribution.map(Number).filter(n => !isNaN(n))
      : [];
      
    // Ensure contributor is an array of strings
    const contributor = Array.isArray(expense.contributor)
      ? expense.contributor.map(id => id?.toString() ?? '').filter(Boolean)
      : [];
      
    // Ensure contribution_status is properly typed
    const contribution_status = Array.isArray(expense.contribution_status)
      ? expense.contribution_status
      : [];
      
    const newExpense: Expense = { 
      id: randomUUID(),
      type: expense.type,
      category: expense.category || 'Event',
      description: expense.description || null,
      amount: expense.amount,
      date: (() => {
        const dateObj = expense.date 
          ? (expense.date instanceof Date 
              ? expense.date 
              : new Date(expense.date))
          : new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })(),
      status: expense.status || 'Pending',
      from_account: expense.from_account || 'DDC Fund',
      to_account: expense.to_account || null,
      contributor,
      contribution: contribution.map(String),
      contribution_status,
      split_type: expense.split_type || null,
      created_at: new Date(), 
      updated_at: new Date(),
    };
    
    // Update account balance based on transaction type
    const amount = Number(expense.amount);
    switch (expense.type) {
      case 'credit':
        // Add amount to balance
        await this.updateAccountBalanceAmount(amount);
        break;
      case 'debit':
        // Subtract amount from balance
        await this.updateAccountBalanceAmount(-amount);
        break;
      case 'Transfer':
        if (expense.from_account === 'DDC Fund') {
          // Subtract amount from balance
          await this.updateAccountBalanceAmount(-amount);
        } else if (expense.to_account === 'DDC Fund') {
          // Add amount to balance
          await this.updateAccountBalanceAmount(amount);
        }
        // Update repayment records for transfer transactions
        await this.updateRepaymentForTransfer(expense);
        break;
    }
    

    this.expenses.set(newExpense.id, newExpense);
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    // Store old values for balance/repayment adjustments
    const oldType = existing.type;
    const oldAmount = Number(existing.amount);
    const oldFromAccount = existing.from_account;
    const oldToAccount = existing.to_account;
    
    // Process contribution update if provided
    let contribution = existing.contribution;
    if (expense.contribution !== undefined) {
      contribution = Array.isArray(expense.contribution)
        ? expense.contribution.map(n => n?.toString() ?? '0').filter(Boolean)
        : [];
    }
    
    // Process contributor update if provided
    let contributor = existing.contributor;
    if (expense.contributor !== undefined) {
      contributor = Array.isArray(expense.contributor)
        ? expense.contributor.map(id => id?.toString() ?? '').filter(Boolean)
        : [];
    }
    
    // Process contribution_status update if provided
    let contribution_status = existing.contribution_status;
    if (expense.contribution_status !== undefined) {
      contribution_status = Array.isArray(expense.contribution_status)
        ? expense.contribution_status
        : [];
    }
    
    // Process date update if provided
    let date = existing.date;
    if (expense.date !== undefined) {
      date = expense.date instanceof Date 
        ? expense.date.toISOString().split('T')[0]
        : expense.date || existing.date;
    }
    
    const updated: Expense = { 
      ...existing,
      ...expense,
      id: existing.id, // Prevent ID from being overridden
      date,
      contributor,
      contribution,
      contribution_status,
      updated_at: new Date() ,
    };
    
    // Update balance and repayments if type, amount, or accounts changed
    const newType = expense.type || oldType;
    const newAmount = expense.amount ? Number(expense.amount) : oldAmount;
    const newFromAccount = expense.from_account || oldFromAccount;
    const newToAccount = expense.to_account || oldToAccount;
    
    // Revert the old transaction's effect on balance
    await this.revertTransactionEffect(oldType, oldAmount, oldFromAccount, oldToAccount);
    
    // Create a proper InsertExpense object for the new transaction
    const newExpenseData: InsertExpense = {
      type: newType,
      amount: String(newAmount),
      date: expense.date || new Date(existing.date),
      from_account: newFromAccount,
      to_account: newToAccount,
      category: expense.category || existing.category,
      description: expense.description || existing.description,
      status: expense.status || existing.status,
      contributor: expense.contributor || existing.contributor,
      contribution: (expense.contribution || existing.contribution).map(Number),
      contribution_status: expense.contribution_status || existing.contribution_status,
      split_type: expense.split_type || existing.split_type,
    };
    
    // Apply the new transaction's effect on balance
    await this.applyTransactionEffect(newType, newAmount, newFromAccount, newToAccount, newExpenseData);
    
    this.expenses.set(id, updated);
    return updated;
  }

  // Helper to revert transaction effects
  private async revertTransactionEffect(type: string, amount: number, fromAccount: string, toAccount: string | null): Promise<void> {
    switch (type) {
      case 'credit':
        // Subtract the amount that was added
        await this.updateAccountBalanceAmount(-amount);
        break;
      case 'debit':
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
  }

  // Helper to apply transaction effects
  private async applyTransactionEffect(type: string, amount: number, fromAccount: string, toAccount: string | null, expense: InsertExpense): Promise<void> {
    switch (type) {
      case 'credit':
        // Add amount to balance
        await this.updateAccountBalanceAmount(amount);
        break;
      case 'debit':
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
        await this.updateRepaymentForTransfer(expense);
        break;
    }
  }

  // Helper to revert repayment effects
  private async revertRepaymentEffect(type: string, amount: number, fromAccount: string, toAccount: string | null): Promise<void> {
    if (type === 'Transfer' && toAccount === 'DDC Fund' && fromAccount) {
      // Revert CASE 1: Transfer to DDC Fund
      const sourceName = fromAccount;
      const existingRepayment = Array.from(this.repayments.values()).find(r => r.source_name === sourceName);
      
      if (existingRepayment) {
        const currentAllocated = Number(existingRepayment.allocated_amount);
        const currentPending = Number(existingRepayment.pending_amount);
        
        if (currentAllocated > amount) {
          await this.updateRepayment(existingRepayment.id, {
            allocated_amount: String(currentAllocated - amount),
            pending_amount: String(currentPending - amount),
          });
        } else {
          // Remove the record if allocation becomes zero
          await this.deleteRepayment(existingRepayment.id);
        }
      }
    } else if (type === 'Transfer' && fromAccount === 'DDC Fund' && toAccount) {
      // Revert CASE 2: Transfer from DDC Fund
      const sourceName = toAccount;
      const existingRepayment = Array.from(this.repayments.values()).find(r => r.source_name === sourceName);
      
      if (existingRepayment) {
        const currentRepaid = Number(existingRepayment.repaid_amount);
        const currentAllocated = Number(existingRepayment.allocated_amount);
        
        const newRepaidAmount = Math.max(0, currentRepaid - amount);
        const newPendingAmount = currentAllocated - newRepaidAmount;
        
        await this.updateRepayment(existingRepayment.id, {
          repaid_amount: String(newRepaidAmount),
          pending_amount: String(newPendingAmount),
        });
      }
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Account Balance
  async getAccountBalance(): Promise<AccountBalance[]> {
    return Array.from(this.accountBalance.values());
  }

  async getAccountBalanceById(id: number): Promise<AccountBalance | undefined> {
    return this.accountBalance.get(id);
  }

  async createAccountBalance(balance: InsertAccountBalance): Promise<AccountBalance> {
    const id = this.currentAccountBalanceId++;
    const newBalance: AccountBalance = {
      id,
      name: balance.name || 'DDC Fund',
      balance: String(typeof balance.balance === 'number' ? balance.balance : Number(balance.balance) || 0),
    };
    this.accountBalance.set(id, newBalance);
    return newBalance;
  }

  async updateAccountBalance(id: number, balance: Partial<InsertAccountBalance>): Promise<AccountBalance | undefined> {
    const existing = this.accountBalance.get(id);
    if (!existing) return undefined;
    
    const updated: AccountBalance = {
      ...existing,
      name: balance.name !== undefined ? balance.name : existing.name,
      balance: balance.balance !== undefined 
        ? String(typeof balance.balance === 'number' ? balance.balance : Number(balance.balance) || 0)
        : existing.balance,
    };
    this.accountBalance.set(id, updated);
    return updated;
  }

  async deleteAccountBalance(id: number): Promise<boolean> {
    return this.accountBalance.delete(id);
  }

  // Repayments
  async getRepayments(): Promise<Repayment[]> {
    return Array.from(this.repayments.values());
  }

  async getRepayment(id: number): Promise<Repayment | undefined> {
    return this.repayments.get(id);
  }

  async createRepayment(repayment: InsertRepayment): Promise<Repayment> {
    const id = this.currentRepaymentId++;
    const newRepayment: Repayment = {
      id,
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
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.repayments.set(id, newRepayment);
    return newRepayment;
  }

  async updateRepayment(id: number, repayment: Partial<InsertRepayment>): Promise<Repayment | undefined> {
    const existing = this.repayments.get(id);
    if (!existing) return undefined;
    
    const updated: Repayment = {
      ...existing,
      source_name: repayment.source_name !== undefined ? repayment.source_name : existing.source_name,
      allocated_amount: repayment.allocated_amount !== undefined 
        ? String(typeof repayment.allocated_amount === 'number' ? repayment.allocated_amount : Number(repayment.allocated_amount) || 0)
        : existing.allocated_amount,
      repaid_amount: repayment.repaid_amount !== undefined 
        ? String(typeof repayment.repaid_amount === 'number' ? repayment.repaid_amount : Number(repayment.repaid_amount) || 0)
        : existing.repaid_amount,
      pending_amount: repayment.pending_amount !== undefined 
        ? String(typeof repayment.pending_amount === 'number' ? repayment.pending_amount : Number(repayment.pending_amount) || 0)
        : existing.pending_amount,
      updated_at: new Date(),
    };
    this.repayments.set(id, updated);
    return updated;
  }

  async deleteRepayment(id: number): Promise<boolean> {
    const deleted = this.repayments.delete(id);
    return deleted;
  }

  // Helper method to update account balance
  private async updateAccountBalanceAmount(amount: number): Promise<void> {
    // Get the first (and only) account balance record
    const balances = Array.from(this.accountBalance.values());
    if (balances.length === 0) {
      // Create initial record if none exists
      await this.createAccountBalance({ balance: String(amount) });
    } else {
      // Update the existing record
      const existingBalance = balances[0];
      const currentBalance = Number(existingBalance.balance);
      const newBalance = currentBalance + amount;
      await this.updateAccountBalance(existingBalance.id, { balance: String(newBalance) });
    }
  }

  // Helper method to update repayment
  private async updateRepaymentForTransfer(expense: InsertExpense): Promise<void> {
    const amount = Number(expense.amount);
    
    if (expense.type === 'Transfer' && expense.to_account === 'DDC Fund' && expense.from_account) {
      // CASE 1: Transfer to DDC Fund - add or update repayment record
      const sourceName = expense.from_account;
      const existingRepayment = Array.from(this.repayments.values()).find(r => r.source_name === sourceName);
      
      if (existingRepayment) {
        // Update existing record
        const currentAllocated = Number(existingRepayment.allocated_amount);
        const currentPending = Number(existingRepayment.pending_amount);
        
        await this.updateRepayment(existingRepayment.id, {
          allocated_amount: String(currentAllocated + amount),
          pending_amount: String(currentPending + amount),
        });
      } else {
        // Create new record
        await this.createRepayment({
          source_name: sourceName,
          allocated_amount: String(amount),
          repaid_amount: '0',
          pending_amount: String(amount),
        });
      }
    } else if (expense.type === 'Transfer' && expense.from_account === 'DDC Fund' && expense.to_account) {
      // CASE 2: Transfer from DDC Fund - update repayment record
      const sourceName = expense.to_account;
      const existingRepayment = Array.from(this.repayments.values()).find(r => r.source_name === sourceName);
      
      if (existingRepayment) {
        // Update existing record
        const currentRepaid = Number(existingRepayment.repaid_amount);
        const currentAllocated = Number(existingRepayment.allocated_amount);
        
        const newRepaidAmount = currentRepaid + amount;
        const newPendingAmount = currentAllocated - newRepaidAmount;
        
        await this.updateRepayment(existingRepayment.id, {
          repaid_amount: String(newRepaidAmount),
          pending_amount: String(newPendingAmount),
        });
      }
    }
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  // Helper function to safely format dates
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString().split('T')[0];
    if (typeof date === 'string') return date;
    return '';
  }

  // Helper function to handle numeric fields
  private formatNumber(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value.toString();
    return value || null;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Ensure registeredOn is properly formatted as a string
    const registeredOn = event.registeredOn 
      ? this.formatDate(event.registeredOn)
      : new Date().toISOString().split('T')[0];
      
    const newEvent: Event = {
      id: randomUUID(),
      providedService: event.providedService,
      eventName: event.eventName,
      registeredOn: registeredOn,
      eventDate: this.formatDate(event.eventDate),
      venue: event.venue,
      source: event.source ?? null,
      clientName: event.clientName ?? null,
      clientPhone: event.clientPhone ?? null,
      clientAddress: event.clientAddress ?? null,
      clientEmail: event.clientEmail ?? null,
      eventStatus: event.eventStatus ?? 'Draft',
      paymentStatus: event.paymentStatus ?? 'Pending',
      paymentMode: event.paymentMode ?? null,
      notes: event.notes ?? null,
      finalizedQuote: this.formatNumber(event.finalizedQuote),
      initialQuote: this.formatNumber(event.initialQuote),
      ddcCost: this.formatNumber(event.ddcCost),
      profitLoss: this.formatNumber(event.profitLoss),
    };
    
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.events.get(id);
    if (!existing) return undefined;

    const updated: Event = { ...existing };

    // Update all provided fields
    if (event.providedService !== undefined) updated.providedService = event.providedService;
    if (event.eventName !== undefined) updated.eventName = event.eventName;
    if (event.venue !== undefined) updated.venue = event.venue;
    if (event.source !== undefined) updated.source = event.source ?? null;
    if (event.clientName !== undefined) updated.clientName = event.clientName ?? null;
    if (event.clientPhone !== undefined) updated.clientPhone = event.clientPhone ?? null;
    if (event.clientAddress !== undefined) updated.clientAddress = event.clientAddress ?? null;
    if (event.clientEmail !== undefined) updated.clientEmail = event.clientEmail ?? null;
    if (event.eventStatus !== undefined) updated.eventStatus = event.eventStatus ?? 'Draft';
    if (event.paymentStatus !== undefined) updated.paymentStatus = event.paymentStatus ?? 'Pending';
    if (event.paymentMode !== undefined) updated.paymentMode = event.paymentMode ?? null;
    if (event.notes !== undefined) updated.notes = event.notes ?? null;
    
    // Handle numeric fields
    if (event.finalizedQuote !== undefined) updated.finalizedQuote = this.formatNumber(event.finalizedQuote);
    if (event.initialQuote !== undefined) updated.initialQuote = this.formatNumber(event.initialQuote);
    if (event.ddcCost !== undefined) updated.ddcCost = this.formatNumber(event.ddcCost);
    if (event.profitLoss !== undefined) updated.profitLoss = this.formatNumber(event.profitLoss);
    
    // Handle date fields
    if (event.registeredOn !== undefined) {
      updated.registeredOn = this.formatDate(event.registeredOn) || updated.registeredOn;
    }
    
    if (event.eventDate !== undefined) {
      updated.eventDate = this.formatDate(event.eventDate) || '';
    }
    
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Requirements
  async getAllRequirements(): Promise<Requirement[]> {
    return Array.from(this.requirements.values());
  }

  async getRequirements(eventId: string): Promise<Requirement[]> {
    return Array.from(this.requirements.values()).filter((r) => r.eventId === eventId);
  }

  async getRequirement(id: string): Promise<Requirement | undefined> {
    return this.requirements.get(id);
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const newRequirement: Requirement = { 
      id: randomUUID(),
      eventId: requirement.eventId,
      description: requirement.description || '',
      requirement: requirement.requirement,
      requirementOwner: requirement.requirementOwner || null,
      requirementStatus: requirement.requirementStatus || 'To Do',
      order: requirement.order ?? 0,
      price: requirement.price ?? 0,
      quantity: requirement.quantity ?? 1,
    };
    this.requirements.set(newRequirement.id, newRequirement);
    return newRequirement;
  }

  async updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined> {
    const existing = this.requirements.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...requirement };
    this.requirements.set(id, updated);
    return updated;
  }

  async deleteRequirement(id: string): Promise<boolean> {
    return this.requirements.delete(id);
  }

  // Fulfillment Plans
  async getAllFulfillmentPlans(): Promise<FulfillmentPlan[]> {
    return Array.from(this.fulfillmentPlans.values());
  }

  async getFulfillmentPlans(requirementId: string): Promise<FulfillmentPlan[]> {
    return Array.from(this.fulfillmentPlans.values()).filter((p) => p.requirementId === requirementId);
  }

  async getFulfillmentPlan(id: string): Promise<FulfillmentPlan | undefined> {
    return this.fulfillmentPlans.get(id);
  }

  async createFulfillmentPlan(plan: InsertFulfillmentPlan): Promise<FulfillmentPlan> {
    const now = new Date();
    const newPlan: FulfillmentPlan = { 
      id: randomUUID(),
      requirementId: plan.requirementId,
      planType: plan.planType,
      vendorId: plan.vendorId || null,
      vendorCategory: plan.vendorCategory || null,
      teamMemberId: plan.teamMemberId || null,
      teamRole: plan.teamRole || null,
      assetId: plan.assetId || null,
      assetPurchaseStatus: plan.assetPurchaseStatus || null,
      createdAt: now,
      updatedAt: now,
      assetCategory: plan.assetCategory || null,
      payment: plan.payment !== undefined ? String(plan.payment) : null,
      paymentStatus: plan.paymentStatus || null,
      planStatus: plan.planStatus || 'To Do'
    };
    console.log('Trying to insert:', JSON.stringify(newPlan, null, 2));
    this.fulfillmentPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  async updateFulfillmentPlan(id: string, plan: Partial<InsertFulfillmentPlan>): Promise<FulfillmentPlan | undefined> {
    const existing = this.fulfillmentPlans.get(id);
    if (!existing) return undefined;
    
    // Create a new object with only the fields we want to update
    const updated: FulfillmentPlan = { 
      ...existing,
      // Only spread the plan fields that are actually provided
      ...(plan.requirementId !== undefined && { requirementId: plan.requirementId }),
      ...(plan.planType !== undefined && { planType: plan.planType }),
      ...(plan.teamMemberId !== undefined && { teamMemberId: plan.teamMemberId }),
      ...(plan.teamRole !== undefined && { teamRole: plan.teamRole }),
      ...(plan.paymentStatus !== undefined && { paymentStatus: plan.paymentStatus }),
      ...(plan.vendorId !== undefined && { vendorId: plan.vendorId }),
      ...(plan.vendorCategory !== undefined && { vendorCategory: plan.vendorCategory }),
      ...(plan.assetId !== undefined && { assetId: plan.assetId }),
      ...(plan.assetCategory !== undefined && { assetCategory: plan.assetCategory }),
      ...(plan.assetPurchaseStatus !== undefined && { assetPurchaseStatus: plan.assetPurchaseStatus }),
      ...(plan.planStatus !== undefined && { planStatus: plan.planStatus }),
      // Handle payment separately to ensure it's always a string
      payment: plan.payment !== undefined ? String(plan.payment) : existing.payment,
      updatedAt: new Date()
    };
    
    this.fulfillmentPlans.set(id, updated);
    return updated;
  }

  async deleteFulfillmentPlan(id: string): Promise<boolean> {
    return this.fulfillmentPlans.delete(id);
  }
  
  getStorageType(): string {
    return 'MemStorage';
  }
}

import { DatabaseStorage } from './database-storage';

// Use database storage if DATABASE_URL is provided, otherwise fall back to memory storage
console.log('Storage initialization:', {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL ? '[REDACTED]' : 'NOT_SET',
  storageType: process.env.DATABASE_URL ? 'DatabaseStorage' : 'MemStorage'
});

export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
