import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import { ServerInvoiceTemplate } from './invoice-template';
import React from 'react';
import {
  insertConfigurationSchema,
  insertAssetSchema,
  insertVendorSchema,
  insertTeamMemberSchema,
  insertExpenseSchema,
  insertEventSchema,
  insertRequirementSchema,
  insertFulfillmentPlanSchema,
  insertAccountBalanceSchema,
  insertRepaymentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render deployment
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Debug endpoint to check storage type and environment
  app.get("/debug", (_req, res) => {
    res.status(200).json({ 
      storageType: storage.getStorageType(),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? '[REDACTED]' : 'NOT_SET',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Root endpoint - only serve API response in production
  app.get("/api", (_req, res) => {
    res.json({ 
      message: "DDC Management API is running!", 
      status: "healthy",
      version: "1.0.0"
    });
  });

  // Seed database route
  app.post("/api/seed", async (_req, res) => {
    try {
      const result = await seedDatabase();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // Configuration routes
  app.get("/api/configuration", async (_req, res) => {
    const config = await storage.getConfiguration();
    res.json(config);
  });

  app.post("/api/configuration", async (req, res) => {
    try {
      const validatedData = insertConfigurationSchema.parse(req.body);
      const config = await storage.createConfiguration(validatedData);
      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/configuration/:id", async (req, res) => {
    try {
      const config = await storage.updateConfiguration(req.params.id, req.body);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Asset routes
  app.get("/api/assets", async (_req, res) => {
    const assets = await storage.getAssets();
    res.json(assets);
  });

  app.get("/api/assets/:id", async (req, res) => {
    const asset = await storage.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.json(asset);
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(validatedData);
      res.status(201).json(asset);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.updateAsset(req.params.id, req.body);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    const deleted = await storage.deleteAsset(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.json({ success: true });
  });

  // Vendor routes
  app.get("/api/vendors", async (_req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.get("/api/vendors/:id", async (req, res) => {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.updateVendor(req.params.id, req.body);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    const deleted = await storage.deleteVendor(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.status(204).send();
  });

  // Team Member routes
  app.get("/api/team", async (_req, res) => {
    const members = await storage.getTeamMembers();
    res.json(members);
  });

  app.get("/api/team/:id", async (req, res) => {
    const member = await storage.getTeamMember(req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.json(member);
  });

  app.post("/api/team", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/team/:id", async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/team/:id", async (req, res) => {
    const deleted = await storage.deleteTeamMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.status(204).send();
  });

  // Expense routes
  app.get("/api/expenses", async (_req, res) => {
    console.log('[API] GET /api/expenses - Fetching all expenses');
    try {
      const expenses = await storage.getExpenses();
      console.log(`[API] Successfully fetched ${expenses.length} expenses`);
      res.json(expenses);
    } catch (error: any) {
      console.error('[API] Error fetching expenses:', error);
      res.status(500).json({ 
        error: 'Failed to fetch expenses',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] GET /api/expenses/${id} - Fetching expense`);
    try {
      const expense = await storage.getExpense(id);
      if (!expense) {
        console.log(`[API] Expense ${id} not found`);
        return res.status(404).json({ error: "Expense not found" });
      }
      console.log(`[API] Successfully fetched expense ${id}`);
      res.json(expense);
    } catch (error: any) {
      console.error(`[API] Error fetching expense ${id}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch expense ${id}`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    console.log('[API] POST /api/expenses - Creating new expense');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      console.log('Validating expense data...');
      const validatedData = insertExpenseSchema.parse(req.body);
      console.log('Validation successful, creating expense...');
      
      const expense = await storage.createExpense(validatedData);
      console.log(`[API] Successfully created expense ${expense.id}`);
      
      res.status(201).json(expense);
    } catch (error: any) {
      console.error('[API] Error creating expense:', error);
      
      if (error.name === 'ZodError') {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ 
          error: 'Validation error',
          details: error.errors,
          message: error.message
        });
      }
      
      res.status(400).json({ 
        error: 'Failed to create expense',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      
      const expense = await storage.updateExpense(id, validatedData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error: any) {
      
      if (error.name === 'ZodError') {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ 
          error: 'Validation error',
          details: error.errors,
          message: error.message
        });
      }
      
      res.status(400).json({ 
        error: 'Failed to update expense',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Update an existing expense
  app.put("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] PUT /api/expenses/${id} - Updating expense`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Validate request body against the schema
      const expenseData = insertExpenseSchema.parse(req.body);
      
      // Update the expense in the database
      const updatedExpense = await storage.updateExpense(id, expenseData);
      
      if (!updatedExpense) {
        console.error(`[API] Error: Expense with ID ${id} not found`);
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      console.log(`[API] Successfully updated expense ${id}`);
      res.status(200).json(updatedExpense);
    } catch (error) {
      console.error(`[API] Error updating expense ${id}:`, error);
      console.error('[API] Error type:', typeof error);
      console.error('[API] Error constructor name:', error?.constructor?.name);
      console.error('[API] Error is ZodError:', error instanceof z.ZodError);
      
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        console.error('[API] ZodError details:', JSON.stringify(error, null, 2));
        return res.status(400).json({
          error: 'Validation error',
          details: (error as any).errors,
        });
      }
      
      console.error('[API] Error properties:', Object.getOwnPropertyNames(error));
      res.status(500).json({ 
        error: 'Failed to update expense',
        errorType: error?.constructor?.name || typeof error
      });
    }
  });

  // Delete an expense
  app.delete("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] DELETE /api/expenses/${id} - Deleting expense`);
    
    try {
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        console.log(`[API] Expense ${id} not found for deletion`);
        return res.status(404).json({ error: "Expense not found" });
      }
      
      console.log(`[API] Successfully deleted expense ${id}`);
      res.status(204).send();
    } catch (error: any) {
      console.error(`[API] Error deleting expense ${id}:`, error);
      res.status(500).json({ 
        error: `Failed to delete expense ${id}`,
        message: error.message 
      });
    }
  });

  // Account Balance routes
  app.get("/api/account-balance", async (_req, res) => {
    console.log('[API] GET /api/account-balance - Fetching all account balances');
    try {
      const balances = await storage.getAccountBalance();
      console.log(`[API] Successfully fetched ${balances.length} account balances`);
      res.json(balances);
    } catch (error) {
      console.error('[API] Error fetching account balances:', error);
      res.status(500).json({ error: "Failed to fetch account balances" });
    }
  });

  app.get("/api/account-balance/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] GET /api/account-balance/${id} - Fetching account balance`);
    try {
      const balance = await storage.getAccountBalanceById(Number(id));
      if (!balance) {
        console.log(`[API] Account balance ${id} not found`);
        return res.status(404).json({ error: "Account balance not found" });
      }
      console.log(`[API] Successfully fetched account balance ${id}`);
      res.json(balance);
    } catch (error) {
      console.error(`[API] Error fetching account balance ${id}:`, error);
      res.status(500).json({ error: "Failed to fetch account balance" });
    }
  });

  app.post("/api/account-balance", async (req, res) => {
    console.log('[API] POST /api/account-balance - Creating account balance');
    try {
      const result = insertAccountBalanceSchema.safeParse(req.body);
      if (!result.success) {
        console.error('[API] Invalid account balance data:', result.error);
        return res.status(400).json({ error: "Invalid account balance data", details: result.error });
      }
      
      const newBalance = await storage.createAccountBalance(result.data);
      console.log('[API] Account balance created successfully:', newBalance);
      res.status(201).json(newBalance);
    } catch (error) {
      console.error('[API] Error creating account balance:', error);
      res.status(500).json({ error: "Failed to create account balance" });
    }
  });

  app.put("/api/account-balance/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] PUT /api/account-balance/${id} - Updating account balance`);
    try {
      const result = insertAccountBalanceSchema.partial().safeParse(req.body);
      if (!result.success) {
        console.error('[API] Invalid account balance update data:', result.error);
        return res.status(400).json({ error: "Invalid account balance data", details: result.error });
      }
      
      const updatedBalance = await storage.updateAccountBalance(Number(id), result.data);
      if (!updatedBalance) {
        console.log(`[API] Account balance ${id} not found for update`);
        return res.status(404).json({ error: "Account balance not found" });
      }
      
      console.log(`[API] Account balance ${id} updated successfully:`, updatedBalance);
      res.json(updatedBalance);
    } catch (error) {
      console.error(`[API] Error updating account balance ${id}:`, error);
      res.status(500).json({ error: "Failed to update account balance" });
    }
  });

  app.delete("/api/account-balance/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] DELETE /api/account-balance/${id} - Deleting account balance`);
    
    try {
      const deleted = await storage.deleteAccountBalance(Number(id));
      if (!deleted) {
        console.log(`[API] Account balance ${id} not found for deletion`);
        return res.status(404).json({ error: "Account balance not found" });
      }
      
      console.log(`[API] Account balance ${id} deleted successfully`);
      res.status(204).send();
    } catch (error: any) {
      console.error(`[API] Error deleting account balance ${id}:`, error);
      res.status(500).json({ 
        error: "Failed to delete account balance",
        message: error.message 
      });
    }
  });

  // Repayments routes
  app.get("/api/repayments", async (_req, res) => {
    console.log('[API] GET /api/repayments - Fetching all repayments');
    try {
      const repayments = await storage.getRepayments();
      console.log(`[API] Successfully fetched ${repayments.length} repayments`);
      res.json(repayments);
    } catch (error) {
      console.error('[API] Error fetching repayments:', error);
      res.status(500).json({ error: "Failed to fetch repayments" });
    }
  });

  app.get("/api/repayments/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] GET /api/repayments/${id} - Fetching repayment`);
    try {
      const repayment = await storage.getRepayment(Number(id));
      if (!repayment) {
        console.log(`[API] Repayment ${id} not found`);
        return res.status(404).json({ error: "Repayment not found" });
      }
      console.log(`[API] Successfully fetched repayment ${id}`);
      res.json(repayment);
    } catch (error) {
      console.error(`[API] Error fetching repayment ${id}:`, error);
      res.status(500).json({ error: "Failed to fetch repayment" });
    }
  });

  app.post("/api/repayments", async (req, res) => {
    console.log('[API] POST /api/repayments - Creating repayment');
    try {
      const result = insertRepaymentSchema.safeParse(req.body);
      if (!result.success) {
        console.error('[API] Invalid repayment data:', result.error);
        return res.status(400).json({ error: "Invalid repayment data", details: result.error });
      }
      
      const newRepayment = await storage.createRepayment(result.data);
      console.log('[API] Repayment created successfully:', newRepayment);
      res.status(201).json(newRepayment);
    } catch (error) {
      console.error('[API] Error creating repayment:', error);
      res.status(500).json({ error: "Failed to create repayment" });
    }
  });

  app.put("/api/repayments/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] PUT /api/repayments/${id} - Updating repayment`);
    try {
      const result = insertRepaymentSchema.partial().safeParse(req.body);
      if (!result.success) {
        console.error('[API] Invalid repayment update data:', result.error);
        return res.status(400).json({ error: "Invalid repayment data", details: result.error });
      }
      
      const updatedRepayment = await storage.updateRepayment(Number(id), result.data);
      if (!updatedRepayment) {
        console.log(`[API] Repayment ${id} not found for update`);
        return res.status(404).json({ error: "Repayment not found" });
      }
      
      console.log(`[API] Repayment ${id} updated successfully:`, updatedRepayment);
      res.json(updatedRepayment);
    } catch (error) {
      console.error(`[API] Error updating repayment ${id}:`, error);
      res.status(500).json({ error: "Failed to update repayment" });
    }
  });

  app.delete("/api/repayments/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] DELETE /api/repayments/${id} - Deleting repayment`);
    
    try {
      const deleted = await storage.deleteRepayment(Number(id));
      if (!deleted) {
        console.log(`[API] Repayment ${id} not found for deletion`);
        return res.status(404).json({ error: "Repayment not found" });
      }
      
      console.log(`[API] Repayment ${id} deleted successfully`);
      res.status(204).send();
    } catch (error: any) {
      console.error(`[API] Error deleting repayment ${id}:`, error);
      res.status(500).json({ 
        error: "Failed to delete repayment",
        message: error.message 
      });
    }
  });

  // Event routes
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  });

  app.post("/api/events", async (req, res) => {
    try {
      console.log('Creating event with data:', JSON.stringify(req.body, null, 2));
      const validatedData = insertEventSchema.parse(req.body);
      
      // Convert registeredOn to a string if it's a Date object
      const eventData = {
        ...validatedData,
        registeredOn: validatedData.registeredOn 
          ? new Date(validatedData.registeredOn).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      };
      
      console.log('Creating event with:', JSON.stringify(eventData, null, 2));
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Event creation failed:', error.message);
      console.error('Full error:', error);
      if (error.issues) {
        console.error('Validation issues:', JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update event budget information (finalizedQuote, ddcCost)
  app.patch("/api/events/:id/budget", async (req, res) => {
    try {
      const { finalizedQuote, ddcCost } = req.body;
      
      // Validate input
      if (finalizedQuote === undefined && ddcCost === undefined) {
        return res.status(400).json({ error: "At least one field (finalizedQuote or ddcCost) is required" });
      }
      
      // Prepare update object with only the fields that were provided
      const updateData: { finalizedQuote?: string; ddcCost?: string } = {};
      
      if (finalizedQuote !== undefined) {
        const quote = Number(finalizedQuote);
        if (isNaN(quote) || quote < 0) {
          return res.status(400).json({ error: "finalizedQuote must be a positive number" });
        }
        updateData.finalizedQuote = quote.toString();
      }
      
      if (ddcCost !== undefined) {
        const cost = Number(ddcCost);
        if (isNaN(cost) || cost < 0) {
          return res.status(400).json({ error: "ddcCost must be a positive number" });
        }
        updateData.ddcCost = cost.toString();
      }
      
      const updatedEvent = await storage.updateEvent(req.params.id, updateData);
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const deleted = await storage.deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  });

  // Health check endpoint for PDF download testing
  app.get("/api/events/:id/health", async (req, res) => {
    console.log('🏥 Health check called for event:', req.params.id);
    const { id } = req.params;
    
    try {
      const event = await storage.getEvent(id);
      res.json({
        status: 'healthy',
        eventId: id,
        eventFound: !!event,
        eventName: event?.eventName || 'N/A',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        eventId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Invoice generation endpoint
  app.get("/api/events/:id/invoice", async (req, res) => {
    console.log('📄 Invoice API called');
    console.log('  Event ID:', req.params.id);
    console.log('  Query params:', req.query);
    console.log('  Headers:', {
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
      'referer': req.headers['referer']
    });
    
    try {
      const { id } = req.params;
      const { invoice_number } = req.query;
      
      console.log('🔍 Starting invoice generation for event:', id);
      
      // Fetch event data
      const event = await storage.getEvent(id);
      if (!event) {
        console.error('❌ Event not found:', id);
        return res.status(404).json({ error: "Event not found" });
      }
      
      console.log('✅ Event found:', event.eventName);
      
      // Fetch requirements
      const requirements = await storage.getRequirements(id);
      if (!requirements || requirements.length === 0) {
        console.error('❌ No requirements found for event:', id);
        return res.status(400).json({ error: "No requirements found for this event" });
      }
      
      console.log('✅ Requirements found:', requirements.length);
      
      // Fetch configuration
      const config = await storage.getConfiguration();
      if (!config) {
        console.error('❌ Configuration not found');
        return res.status(400).json({ error: "Configuration not found" });
      }
      
      console.log('✅ Configuration loaded');
      
      // Calculate invoice value
      const invoiceValue = requirements.reduce((total, req) => {
        const price = parseFloat(String(req.order ?? '0'));
        return total + (isNaN(price) ? 0 : price);
      }, 0);
      
      console.log('💰 Calculated invoice value:', invoiceValue);
      
      if (invoiceValue <= 0) {
        console.error('❌ Invoice value is zero or negative:', invoiceValue);
        return res.status(400).json({ error: "Event has no billable requirements" });
      }
      
      // Generate invoice number if not provided
      const invoiceNumber = invoice_number as string || 
        `INV${event.id.slice(-5).toUpperCase()}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      console.log('📝 Generated invoice number:', invoiceNumber);
      
      // Generate PDF
      console.log('🎨 Starting PDF generation...');
      const invoiceElement = ServerInvoiceTemplate({
        event,
        requirements,
        config,
        invoiceNumber
      });
      
      if (!invoiceElement) {
        console.error('❌ Failed to generate invoice template');
        return res.status(500).json({ error: "Failed to generate invoice template" });
      }
      
      console.log('✅ Invoice template generated successfully');
      
      const pdfBuffer = await renderToBuffer(invoiceElement as React.ReactElement);
      console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
      
      // Set response headers for PDF download
      const fileName = `Invoice_${event.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('📁 Setting response headers for file:', fileName);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ Sending PDF buffer to client');
      // Send PDF buffer
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('💥 Invoice generation error:');
      console.error('  Error message:', error.message);
      console.error('  Error stack:', error.stack);
      console.error('  Full error object:', error);
      res.status(500).json({ 
        error: "Failed to generate invoice",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Quote generation endpoint
  app.get("/api/events/:id/quote", async (req, res) => {
    console.log('📋 Quote API called');
    console.log('  Event ID:', req.params.id);
    console.log('  Query params:', req.query);
    console.log('  Headers:', {
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
      'referer': req.headers['referer']
    });
    
    try {
      const { id } = req.params;
      const { quote_number } = req.query;
      
      console.log('🔍 Starting quote generation for event:', id);
      
      // Fetch event data
      const event = await storage.getEvent(id);
      if (!event) {
        console.error('❌ Event not found for quote:', id);
        return res.status(404).json({ error: "Event not found" });
      }
      
      console.log('✅ Event found for quote:', event.eventName);
      
      // Fetch requirements
      const requirements = await storage.getRequirements(id);
      if (!requirements || requirements.length === 0) {
        console.error('❌ No requirements found for quote event:', id);
        return res.status(400).json({ error: "No requirements found for this event" });
      }
      
      console.log('✅ Requirements found for quote:', requirements.length);
      
      // Fetch configuration
      const config = await storage.getConfiguration();
      if (!config) {
        console.error('❌ Configuration not found for quote');
        return res.status(400).json({ error: "Configuration not found" });
      }
      
      console.log('✅ Configuration loaded for quote');
      
      // Calculate quote value (same as invoice)
      const quoteValue = requirements.reduce((total, req) => {
        const price = parseFloat(String(req.order ?? '0'));
        return total + (isNaN(price) ? 0 : price);
      }, 0);
      
      console.log('💰 Calculated quote value:', quoteValue);
      
      if (quoteValue <= 0) {
        console.error('❌ Quote value is zero or negative:', quoteValue);
        return res.status(400).json({ error: "Event has no billable requirements" });
      }
      
      // Generate quote number if not provided
      const quoteNumber = quote_number as string || 
        `QUO${event.id.slice(-5).toUpperCase()}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      console.log('📝 Generated quote number:', quoteNumber);
      
      // For now, use the invoice template but modify the title
      // TODO: Create a separate quote template without payment information
      console.log('🎨 Starting quote PDF generation...');
      const quoteElement = ServerInvoiceTemplate({
        event,
        requirements,
        config,
        invoiceNumber: quoteNumber.replace('QUO', 'QUOTE-')
      });
      
      if (!quoteElement) {
        console.error('❌ Failed to generate quote template');
        return res.status(500).json({ error: "Failed to generate quote template" });
      }
      
      console.log('✅ Quote template generated successfully');
      
      const pdfBuffer = await renderToBuffer(quoteElement as React.ReactElement);
      console.log('✅ Quote PDF buffer generated, size:', pdfBuffer.length, 'bytes');
      
      // Set response headers for PDF download
      const fileName = `Quote_${event.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('📁 Setting quote response headers for file:', fileName);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ Sending quote PDF buffer to client');
      // Send PDF buffer
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('💥 Quote generation error:');
      console.error('  Error message:', error.message);
      console.error('  Error stack:', error.stack);
      console.error('  Full error object:', error);
      res.status(500).json({ 
        error: "Failed to generate quote",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Requirement routes
  app.get("/api/requirements", async (_req, res) => {
    const requirements = await storage.getAllRequirements();
    res.json(requirements);
  });

  app.get("/api/events/:eventId/requirements", async (req, res) => {
    const requirements = await storage.getRequirements(req.params.eventId);
    res.json(requirements);
  });

  // Create requirement for a specific event
  app.post("/api/events/:eventId/requirements", async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const validatedData = insertRequirementSchema.parse({
        ...req.body,
        eventId: eventId  // Ensure eventId is included
      });
      const requirement = await storage.createRequirement(validatedData);
      res.status(201).json(requirement);
    } catch (error: any) {
      console.error("Error creating requirement for event:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update requirement for a specific event
  app.patch("/api/events/:eventId/requirements/:id", async (req, res) => {
    try {
      const validatedData = insertRequirementSchema.partial().parse(req.body);
      const requirement = await storage.updateRequirement(req.params.id, validatedData);
      
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      
      res.json(requirement);
    } catch (error: any) {
      console.error("Error updating requirement:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete requirement for a specific event
  app.delete("/api/events/:eventId/requirements/:id", async (req, res) => {
    try {
      await storage.deleteRequirement(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting requirement:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/requirements/:id", async (req, res) => {
    const requirement = await storage.getRequirement(req.params.id);
    if (!requirement) {
      return res.status(404).json({ error: "Requirement not found" });
    }
    res.json(requirement);
  });

  app.post("/api/requirements", async (req, res) => {
    try {
      const validatedData = insertRequirementSchema.parse(req.body);
      const requirement = await storage.createRequirement(validatedData);
      res.status(201).json(requirement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/requirements/:id", async (req, res) => {
    try {
      // First, validate the request body against the schema
      const validatedData = insertRequirementSchema.partial().parse(req.body);
      
      // Then update the requirement with validated data
      const requirement = await storage.updateRequirement(req.params.id, validatedData);
      
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      
      res.json(requirement);
    } catch (error: any) {
      console.error("Error updating requirement:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/requirements/:id", async (req, res) => {
    const requirementId = req.params.id;
    try {
      const deleted = await storage.deleteRequirement(requirementId);
      if (!deleted) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ 
        error: "Failed to delete requirement",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Fulfillment Plan routes
  app.get("/api/plans", async (_req, res) => {
    const plans = await storage.getAllFulfillmentPlans();
    res.json(plans);
  });
  
  app.delete("/api/plans/:id", async (req, res) => {
    const planId = req.params.id;
    console.log('DELETE /api/plans/:id - Starting deletion for plan:', planId);
    
    try {
      const deleted = await storage.deleteFulfillmentPlan(planId);
      console.log('DELETE /api/plans/:id - Deletion result:', { deleted, planId });
      
      if (!deleted) {
        console.log('DELETE /api/plans/:id - Plan not found:', planId);
        return res.status(404).json({ error: "Plan not found" });
      }
      
      console.log('DELETE /api/plans/:id - Successfully deleted plan:', planId);
      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/plans/:id - Error deleting plan:', error);
      return res.status(500).json({ 
        error: "Failed to delete plan",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/plans", async (req, res) => {
    try {
      console.log('Creating plan with data:', JSON.stringify(req.body, null, 2));
      
      // Create a clean copy of the request body
      const planData = { ...req.body };
      
      // Handle different plan types
      if (planData.planType === 'Vendor') {
        // For vendor plans, ensure teamMemberId is null
        planData.teamMemberId = null;
      } else if (planData.planType === 'Team') {
        // For team plans, ensure vendorId is null
        planData.vendorId = null;
      }
      
      // Validate the data
      const validatedData = insertFulfillmentPlanSchema.parse(planData);
      console.log('Validation passed, creating plan with:', JSON.stringify(validatedData, null, 2));
      
      const plan = await storage.createFulfillmentPlan(validatedData);
      res.status(201).json(plan);
    } catch (error: any) {
      console.error('Plan creation failed:', error.message);
      console.error('Full error:', error);
      if (error.issues) {
        console.error('Validation issues:', JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ 
        error: error.message,
        details: error.issues?.map((issue: any) => issue.message) || []
      });
    }
  });

  app.get("/api/requirements/:requirementId/plans", async (req, res) => {
    const plans = await storage.getFulfillmentPlans(req.params.requirementId);
    res.json(plans);
  });

  // Create plan for a specific requirement
  app.post("/api/requirements/:requirementId/plans", async (req, res) => {
    try {
      const requirementId = req.params.requirementId;
      
      // Prepare plan data ensuring requirementId is set
      let planData = { ...req.body, requirementId: requirementId };
      
      // Data validation based on plan type
      if (planData.planType === 'Vendor' && planData.vendorId) {
        // For vendor plans, ensure teamMemberId is null
        planData.teamMemberId = null;
      } else if (planData.planType === 'Team' && planData.teamMemberId) {
        // For team plans, ensure vendorId is null
        planData.vendorId = null;
      }
      
      const validatedData = insertFulfillmentPlanSchema.parse(planData);
      const plan = await storage.createFulfillmentPlan(validatedData);
      res.status(201).json(plan);
    } catch (error: any) {
      console.error("Error creating plan for requirement:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/plans/:id", async (req, res) => {
    const plan = await storage.getFulfillmentPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: "Fulfillment plan not found" });
    }
    res.json(plan);
  });

  app.patch("/api/plans/:id", async (req, res) => {
    try {
      console.log('Updating plan with data:', JSON.stringify(req.body, null, 2));
      
      // Create a clean copy of the request body
      const planData = { ...req.body };
      
      // Remove fields that shouldn't be updated
      delete planData.id;
      delete planData.requirementId;
      delete planData.createdAt;
      delete planData.planType; // Don't allow changing plan type during update
      
      // Validate and parse the request body
      const validatedData = insertFulfillmentPlanSchema.partial().parse({
        ...planData,
        // Always update the updatedAt timestamp
        updatedAt: new Date()
      });

      const plan = await storage.updateFulfillmentPlan(req.params.id, validatedData);
      if (!plan) {
        return res.status(404).json({ error: "Fulfillment plan not found" });
      }
      
      console.log('Successfully updated plan:', JSON.stringify(plan, null, 2));
      res.json(plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to update fulfillment plan",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Budget Reports route
  app.get("/api/reports/budget", async (_req, res) => {
    try {
      // Get all completed events
      const allEvents = await storage.getEvents();
      const completedEvents = allEvents.filter(event => event.eventStatus === "Completed");

      const reports = await Promise.all(
        completedEvents.map(async (event) => {
          // Get all requirements for this event
          const requirements = await storage.getRequirements(event.id);

          // Calculate total invoice value (sum of all requirement invoice values minus discounts)
          // First calculate requirement-level invoice values minus their discounts
          const requirementInvoiceAmounts = requirements.map(req => {
            const invoiceAmount = Number(req.order || 0);
            const reqDiscountAmount = req.req_discount === 'true' ? Number(req.req_discount_amount || 0) : 0;
            return invoiceAmount - reqDiscountAmount;
          });
          
          const totalRequirementInvoiceValue = requirementInvoiceAmounts.reduce(
            (sum: number, amount) => sum + amount,
            0
          );
          
          // Get event-level discount
          const eventDiscountAmount = event.discount === 'true' ? Number(event.discount_amount || 0) : 0;
          
          // Final invoice value after all discounts
          const finalInvoiceValue = totalRequirementInvoiceValue - eventDiscountAmount;

          // Calculate actual spent for each requirement
          const requirementBreakdown = await Promise.all(
            requirements.map(async (req, index) => {
              const plans = await storage.getFulfillmentPlans(req.id);
              
              // Sum all costs from plans
              const actualSpent = plans.reduce((sum: number, plan) => {
                const payment = Number(plan.payment || 0);
                return sum + payment;
              }, 0);

              // Use the discounted invoice amount for this requirement
              const invoiceValue = requirementInvoiceAmounts[index];
              const variance = invoiceValue - actualSpent;

              return {
                id: req.id,
                name: req.requirement,
                invoiceValue,
                actualSpent,
                variance,
              };
            })
          );

          // Calculate total actual spent
          const totalActualSpent = requirementBreakdown.reduce(
            (sum: number, req) => sum + req.actualSpent,
            0
          );

          // Calculate overall variance using the final invoice value after discounts
          const variance = finalInvoiceValue - totalActualSpent;
          const variancePercentage = finalInvoiceValue > 0
            ? (variance / finalInvoiceValue) * 100
            : 0;

          return {
            eventId: event.id,
            eventName: event.eventName,
            eventDate: event.eventDate,
            venue: event.venue,
            finalizedQuote: finalInvoiceValue, // Use final invoice value after discounts
            totalRequirementInvoiceValue: finalInvoiceValue, // This should now reflect discounted value
            totalActualSpent,
            variance,
            variancePercentage,
            requirements: requirementBreakdown,
          };
        })
      );

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
