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
      assetCategories: config.assetCategories || [],
      assetPurchaseStatus: config.assetPurchaseStatus || ['Existing', 'New'],
      servicesProvided: config.servicesProvided || [],
      investmentTypes: config.investmentTypes || ['Office'],
      planStatuses: config.planStatuses || ['To Do', 'In Progress', 'Completed'],
      roles: config.roles || ['Designer'],
      paymentModes: config.paymentModes || ['Cash', 'Gray'],
      paymentStatuses: config.paymentStatuses || ['To Do', 'Completed'],
      vendorCategories: config.vendorCategories || ['Decoration', 'Photography'],
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
    return Array.from(this.assets.values());
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const newAsset: Asset = { 
      id: randomUUID(),
      name: asset.name,
      category: asset.category,
      quantity: asset.quantity ?? 1,
      purchaseDate: asset.purchaseDate || null,
      purchasedAmount: asset.purchasedAmount || null,
      status: asset.status || 'Active',
      detailsAndUse: asset.detailsAndUse || null,
      warranty: asset.warranty || null,
    };
    this.assets.set(newAsset.id, newAsset);
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const existing = this.assets.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...asset };
    this.assets.set(id, updated);
    return updated;
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
    const newExpense: Expense = { 
      id: randomUUID(),
      type: expense.type,
      description: expense.description,
      amount: expense.amount,
      mode: expense.mode || null,
      date: expense.date,
      status: expense.status || 'Pending',
    };
    this.expenses.set(newExpense.id, newExpense);
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...expense };
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

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent: Event = { 
      id: randomUUID(),
      providedService: event.providedService,
      eventName: event.eventName,
      registeredOn: event.registeredOn,
      eventDate: event.eventDate,
      venue: event.venue,
      clientInfo: event.clientInfo || null,
      clientName: event.clientName || null,
      clientPhone: event.clientPhone || null,
      clientAddress: event.clientAddress || null,
      clientEmail: event.clientEmail || null,
      eventStatus: event.eventStatus || 'Inquired',
      initialQuote: event.initialQuote || null,
      finalizedQuote: event.finalizedQuote || null,
      ddcCost: event.ddcCost || null,
      profitLoss: event.profitLoss || null,
      paymentMode: event.paymentMode || null,
      paymentStatus: event.paymentStatus || 'Pending',
    };
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...event };
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
      requirement: requirement.requirement,
      requirementOwner: requirement.requirementOwner || null,
      requirementStatus: requirement.requirementStatus || 'To Do',
      order: requirement.order ?? 0,
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
    const newPlan: FulfillmentPlan = { 
      id: randomUUID(),
      requirementId: plan.requirementId,
      planType: plan.planType,
      teamMemberId: plan.teamMemberId || null,
      teamRole: plan.teamRole || null,
      payment: plan.payment || null,
      vendorId: plan.vendorId || null,
      vendorAmount: plan.vendorAmount || null,
      vendorPaymentStatus: plan.vendorPaymentStatus || null,
      assetId: plan.assetId || null,
      assetPurchaseStatus: plan.assetPurchaseStatus || null,
      purchasedValue: plan.purchasedValue || null,
      planStatus: plan.planStatus || 'To Do',
    };
    this.fulfillmentPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  async updateFulfillmentPlan(id: string, plan: Partial<InsertFulfillmentPlan>): Promise<FulfillmentPlan | undefined> {
    const existing = this.fulfillmentPlans.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...plan };
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
