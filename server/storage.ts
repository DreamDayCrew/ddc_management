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
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    this.expenses.set(newExpense.id, newExpense);
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    // Process contribution update if provided
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
    
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
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
