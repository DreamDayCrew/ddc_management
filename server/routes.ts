import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import { ServerInvoiceTemplate } from './invoice-template';
import { ServerCatalogTemplate } from './catalog-template';
import { ServerEventReportTemplate } from './event-report-template';
import { RentalTemplate } from './rental-template';
import React from 'react';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;
const otpStore = new Map<number, { otp: string; expiresAt: Date; attempts: number }>();
const passwordResetTokenStore = new Map<number, { token: string; expiresAt: Date }>();

const MAX_OTP_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function consumeOTPAndGetToken(memberId: number, otp: string): string | null {
  const stored = otpStore.get(memberId);
  if (!stored) return null;
  
  if (new Date() > stored.expiresAt) {
    otpStore.delete(memberId);
    return null;
  }
  
  if (stored.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(memberId);
    return null;
  }
  
  if (stored.otp !== otp) {
    stored.attempts++;
    return null;
  }
  
  // OTP is valid - consume it and generate reset token
  otpStore.delete(memberId);
  
  const token = generateResetToken();
  const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for password reset
  passwordResetTokenStore.set(memberId, { token, expiresAt: tokenExpiry });
  
  return token;
}

function isValidResetToken(memberId: number, token: string): boolean {
  const stored = passwordResetTokenStore.get(memberId);
  if (!stored) return false;
  if (new Date() > stored.expiresAt) {
    passwordResetTokenStore.delete(memberId);
    return false;
  }
  return stored.token === token;
}

function clearResetToken(memberId: number): void {
  passwordResetTokenStore.delete(memberId);
}

// Configure Cloudinary
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️ Cloudinary credentials not configured. Image uploads and deletions will be skipped.');
}

// Configure multer for memory storage (for Cloudinary upload)
const uploadRequirementImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit per image
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).array('images', 5); // Max 5 images

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Resize large images
          { quality: 'auto:good' }, // Auto quality optimization
          { fetch_format: 'auto' } // Auto format (webp for modern browsers)
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
        else reject(new Error('Upload failed'));
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const match = url.match(/\/v\d+\/(.+)\.[^.]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};
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
  insertCatalogItemSchema,
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
    try {
      const deleted = await storage.deleteAsset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete asset" });
    }
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
    try {
      const deleted = await storage.deleteVendor(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete vendor" });
    }
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

  // Update mobile app usage flag
  app.patch("/api/team/:id/mobile-app", async (req, res) => {
    try {
      const { using_mobile_app } = req.body;
      const member = await storage.updateTeamMember(req.params.id, { using_mobile_app });
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/validate", async (req, res) => {
    try {
      const { memberId, password } = req.body;
      
      if (!memberId || !password) {
        return res.status(400).json({ error: "Member ID and password are required" });
      }
      
      const member = await storage.getTeamMember(memberId);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      const storedPassword = member.password || '';
      
      // Support legacy base64 passwords and new bcrypt hashes
      let isValid = false;
      if (storedPassword.startsWith('$2')) {
        // bcrypt hash
        isValid = await bcrypt.compare(password, storedPassword);
      } else if (storedPassword) {
        // Legacy base64 - compare and upgrade to bcrypt
        const decodedStoredPassword = Buffer.from(storedPassword, 'base64').toString('utf-8');
        isValid = decodedStoredPassword === password;
        if (isValid) {
          // Upgrade to bcrypt hash
          const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
          await storage.updateTeamMember(memberId, { password: hashedPassword });
        }
      }
      
      if (isValid) {
        res.json({ valid: true, member: { id: member.id, name: member.name, designation: member.designation } });
      } else {
        res.json({ valid: false });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate OTP for password setup/reset (server-side storage)
  app.post("/api/auth/generate-otp", async (req, res) => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: "Member ID is required" });
      }
      const member = await storage.getTeamMember(memberId);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      if (!member.email) {
        return res.status(400).json({ error: "Team member has no email configured" });
      }
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      otpStore.set(memberId, { otp, expiresAt, attempts: 0 });
      // Send OTP email via EmailJS server-side
      const readableExpiry = new Date(expiresAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      try {
        const { sendOtpEmail } = await import('./email');
        await sendOtpEmail({ email: member.email, otp, time: readableExpiry });
        res.json({ success: true, email: member.email, name: member.name });
      } catch (err: any) {
        res.status(500).json({ error: 'Failed to send OTP email', details: err?.message });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify OTP server-side - consumes OTP and returns reset token
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { memberId, otp } = req.body;
      
      if (!memberId || !otp) {
        return res.status(400).json({ error: "Member ID and OTP are required" });
      }
      
      const resetToken = consumeOTPAndGetToken(memberId, otp);
      
      if (resetToken) {
        res.json({ valid: true, resetToken });
      } else {
        const stored = otpStore.get(memberId);
        if (stored && stored.attempts >= MAX_OTP_ATTEMPTS) {
          res.json({ valid: false, error: "Too many incorrect attempts. Please request a new OTP." });
        } else {
          res.json({ valid: false, error: "Invalid or expired OTP" });
        }
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update password (requires valid reset token, not OTP)
  app.post("/api/auth/update-password", async (req, res) => {
    try {
      const { memberId, password, resetToken } = req.body;
      
      if (!memberId || !password) {
        return res.status(400).json({ error: "Member ID and password are required" });
      }
      
      if (!resetToken) {
        return res.status(400).json({ error: "Reset token required" });
      }
      
      if (!isValidResetToken(memberId, resetToken)) {
        return res.status(401).json({ error: "Invalid or expired reset token. Please verify OTP again." });
      }
      
      if (password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }
      
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      
      const member = await storage.updateTeamMember(memberId, { password: hashedPassword });
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      // Clear the reset token after successful password update
      clearResetToken(memberId);
      
      res.json({ success: true, member: { id: member.id, name: member.name, designation: member.designation } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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

  app.get("/api/expenses/by-event/:eventId", async (req, res) => {
    const { eventId } = req.params;
    console.log(`[API] GET /api/expenses/by-event/${eventId} - Fetching expense by event`);
    try {
      const expense = await storage.getExpenseByEventId(eventId);
      if (!expense) {
        console.log(`[API] No expense found for event ${eventId}`);
        return res.status(404).json({ error: "Expense not found for this event" });
      }
      console.log(`[API] Successfully fetched expense for event ${eventId}`);
      res.json(expense);
    } catch (error: any) {
      console.error(`[API] Error fetching expense by event ${eventId}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch expense for event ${eventId}`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/expenses/by-plan/:planId", async (req, res) => {
    const { planId } = req.params;
    console.log(`[API] GET /api/expenses/by-plan/${planId} - Fetching expense by plan`);
    try {
      const expense = await storage.getExpenseByPlanId(planId);
      if (!expense) {
        console.log(`[API] No expense found for plan ${planId}`);
        return res.status(404).json({ error: "Expense not found for this plan" });
      }
      console.log(`[API] Successfully fetched expense for plan ${planId}`);
      res.json(expense);
    } catch (error: any) {
      console.error(`[API] Error fetching expense by plan ${planId}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch expense for plan ${planId}`,
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
      console.log('Validation successful, checking for duplicates...');
      
      // Server-side duplicate check for fulfillment plan expenses
      if (validatedData.fulfillmentPlanId) {
        const existingExpense = await storage.getExpenseByPlanId(validatedData.fulfillmentPlanId);
        if (existingExpense) {
          console.log(`[API] Duplicate expense detected for plan ${validatedData.fulfillmentPlanId}`);
          return res.status(409).json({ 
            error: 'Expense already exists for this plan',
            existingExpenseId: existingExpense.id
          });
        }
      }
      
      // Server-side duplicate check for event expenses
      if (validatedData.eventId) {
        const existingExpense = await storage.getExpenseByEventId(validatedData.eventId);
        if (existingExpense) {
          console.log(`[API] Duplicate expense detected for event ${validatedData.eventId}`);
          return res.status(409).json({ 
            error: 'Expense already exists for this event',
            existingExpenseId: existingExpense.id
          });
        }
      }
      
      console.log('No duplicates found, creating expense...');
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
    const eventId = req.params.id;
    
    try {
      // 0. First check if the event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.log(`❌ Event not found: ${eventId}`);
        return res.status(404).json({ error: "Event not found" });
      }
      
      console.log(`🗑️ Deleting event: ${event.eventName} (${eventId})`);
      
      // 1. Delete all expenses linked to the event directly
      const eventExpense = await storage.getExpenseByEventId(eventId);
      if (eventExpense) {
        console.log(`📊 Deleting expense linked to event ${eventId}`);
        await storage.deleteExpense(eventExpense.id);
      }
      
      // 2. Delete all plans and their linked expenses for each requirement of the event
      const requirements = await storage.getRequirements(eventId);
      console.log(`📋 Found ${requirements.length} requirement(s) for event ${eventId}`);
      
      for (const req of requirements) {
        // Delete requirement images from Cloudinary
        if (req.images && req.images.length > 0 && isCloudinaryConfigured) {
          console.log(`🖼️ Deleting ${req.images.length} image(s) from Cloudinary for requirement ${req.id}`);
          for (const imageUrl of req.images) {
            const publicId = getPublicIdFromUrl(imageUrl);
            if (publicId) {
              try {
                await cloudinary.uploader.destroy(publicId);
                console.log(`✅ Successfully deleted image from Cloudinary: ${publicId}`);
              } catch (cloudinaryError) {
                console.warn(`⚠️ Failed to delete image from Cloudinary: ${publicId}`, cloudinaryError);
                // Continue even if Cloudinary delete fails
              }
            }
          }
        } else if (req.images && req.images.length > 0 && !isCloudinaryConfigured) {
          console.log(`⚠️ Skipping deletion of ${req.images.length} image(s) - Cloudinary not configured`);
        }
        
        // Delete plans and their expenses
        const plans = await storage.getFulfillmentPlans(req.id);
        console.log(`📦 Deleting ${plans.length} plan(s) for requirement ${req.id}`);
        for (const plan of plans) {
          // Delete expense linked to this fulfillment plan (if any)
          const planExpense = await storage.getExpenseByPlanId(plan.id);
          if (planExpense) {
            console.log(`💰 Deleting expense linked to plan ${plan.id}`);
            await storage.deleteExpense(planExpense.id);
          }
          await storage.deleteFulfillmentPlan(plan.id);
        }
        
        // Delete the requirement
        await storage.deleteRequirement(req.id);
        console.log(`✅ Deleted requirement ${req.id}`);
      }
      
      // 3. Finally, delete the main event
      const deleted = await storage.deleteEvent(eventId);
      if (!deleted) {
        console.error(`❌ Failed to delete event ${eventId} from database`);
        return res.status(500).json({ error: "Failed to delete event from database" });
      }
      
      console.log(`✅ Successfully deleted event ${eventId}`);
      res.status(204).send();
    } catch (error) {
      console.error(`💥 Error deleting event ${eventId}:`, error);
      res.status(500).json({ 
        error: "Failed to delete event", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
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

  // Event Report PDF generation endpoint
  app.get("/api/events/:id/report", async (req, res) => {
    console.log('📊 Event Report API called');
    console.log('  Event ID:', req.params.id);
    
    try {
      const { id } = req.params;
      
      // Fetch event data
      const event = await storage.getEvent(id);
      if (!event) {
        console.error('❌ Event not found for report:', id);
        return res.status(404).json({ error: "Event not found" });
      }
      
      console.log('✅ Event found for report:', event.eventName);
      
      // Fetch requirements with fulfillment plans
      const requirements = await storage.getRequirements(id);
      console.log('✅ Requirements found:', requirements.length);
      
      // Fetch fulfillment plans for each requirement
      const requirementsWithPlans = await Promise.all(
        requirements.map(async (req) => {
          const plans = await storage.getFulfillmentPlans(req.id);
          return { ...req, plans: plans || [] };
        })
      );
      
      // Fetch configuration
      const config = await storage.getConfiguration();
      console.log('✅ Configuration loaded');
      
      // Fetch linked expense for this event
      let eventExpense = null;
      try {
        eventExpense = await storage.getExpenseByEventId(id);
      } catch (e) {
        console.log('No linked expense found for event');
      }
      
      // Generate PDF
      console.log('🎨 Starting Event Report PDF generation...');
      const reportElement = ServerEventReportTemplate({
        event,
        requirements: requirementsWithPlans,
        configuration: config || null,
        eventExpense: eventExpense || null,
      });
      
      if (!reportElement) {
        console.error('❌ Failed to generate event report template');
        return res.status(500).json({ error: "Failed to generate event report template" });
      }
      
      console.log('✅ Event Report template generated successfully');
      
      const pdfBuffer = await renderToBuffer(reportElement as React.ReactElement);
      console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
      
      // Set response headers for PDF download
      const fileName = `EventReport_${event.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ Sending Event Report PDF to client');
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('💥 Event Report generation error:');
      console.error('  Error message:', error.message);
      console.error('  Error stack:', error.stack);
      res.status(500).json({ 
        error: "Failed to generate event report",
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

  // Quotation generation endpoint
  app.get("/api/events/:id/quotation", async (req, res) => {
    try {
      const { id } = req.params;
      const { quotation_number } = req.query;
      
      // Fetch event data
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Fetch requirements
      const requirements = await storage.getRequirements(id);
      if (!requirements || requirements.length === 0) {
        return res.status(400).json({ error: "No requirements found for this event" });
      }
      
      // Fetch configuration
      const config = await storage.getConfiguration();
      if (!config) {
        return res.status(400).json({ error: "Configuration not found" });
      }
      
      // Calculate quotation value
      const quotationValue = requirements.reduce((total, req) => {
        const price = parseFloat(String(req.order ?? '0'));
        return total + (isNaN(price) ? 0 : price);
      }, 0);
      
      if (quotationValue <= 0) {
        return res.status(400).json({ error: "Event has no billable requirements" });
      }
      
      // Generate quotation number if not provided
      const quotationNumber = quotation_number as string || 
        `QTN${event.id.slice(-5).toUpperCase()}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      // Generate PDF with documentType = 'Quotation'
      const quotationElement = ServerInvoiceTemplate({
        event,
        requirements,
        config,
        invoiceNumber: quotationNumber,
        documentType: 'Quotation'
      });
      
      if (!quotationElement) {
        return res.status(500).json({ error: "Failed to generate quotation template" });
      }
      
      const pdfBuffer = await renderToBuffer(quotationElement as React.ReactElement);
      
      // Set response headers for PDF download
      const fileName = `Quotation_${event.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF buffer
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('Error generating quotation:', error);
      res.status(500).json({ error: "Failed to generate quotation" });
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
      const requirementId = req.params.id;
      
      // Delete all expenses linked to fulfillment plans of this requirement
      const plans = await storage.getFulfillmentPlans(requirementId);
      for (const plan of plans) {
        const planExpense = await storage.getExpenseByPlanId(plan.id);
        if (planExpense) {
          console.log(`Deleting expense linked to plan ${plan.id}`);
          await storage.deleteExpense(planExpense.id);
        }
        await storage.deleteFulfillmentPlan(plan.id);
      }
      
      await storage.deleteRequirement(requirementId);
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

  // Upload images for a requirement (max 5 images) - Using Cloudinary
  app.post("/api/requirements/:id/images", (req, res) => {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ 
        error: "Image upload not available - Cloudinary not configured" 
      });
    }

    uploadRequirementImages(req, res, async (err) => {
      if (err) {
        console.error("Image upload error:", err);
        return res.status(400).json({ error: err.message });
      }

      try {
        const requirementId = req.params.id;
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        // Get existing requirement
        const existingRequirement = await storage.getRequirement(requirementId);
        if (!existingRequirement) {
          return res.status(404).json({ error: "Requirement not found" });
        }

        const existingImages = existingRequirement.images || [];
        
        // Check max 5 images limit
        if (existingImages.length + files.length > 5) {
          return res.status(400).json({ 
            error: `Cannot upload. Max 5 images allowed. Currently have ${existingImages.length}.`
          });
        }

        // Upload files to Cloudinary
        const uploadPromises = files.map(file => 
          uploadToCloudinary(file.buffer, `dream-day-crew/requirements/${requirementId}`)
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        const newImageUrls = uploadResults.map(result => result.secure_url);

        // Update requirement with new Cloudinary URLs
        const updatedImages = [...existingImages, ...newImageUrls];
        const updated = await storage.updateRequirement(requirementId, { images: updatedImages });
        
        res.json({ 
          success: true, 
          images: updated?.images || updatedImages,
          message: `${files.length} image(s) uploaded successfully`
        });
      } catch (error: any) {
        console.error("Error uploading to Cloudinary:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });

  // Delete an image from a requirement - Using Cloudinary
  app.delete("/api/requirements/:id/images", async (req, res) => {
    try {
      const requirementId = req.params.id;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      const requirement = await storage.getRequirement(requirementId);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }

      const existingImages = requirement.images || [];
      const updatedImages = existingImages.filter(img => img !== imageUrl);

      if (existingImages.length === updatedImages.length) {
        return res.status(404).json({ error: "Image not found in requirement" });
      }

      // Delete from Cloudinary
      if (isCloudinaryConfigured) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
          } catch (cloudinaryError) {
            console.warn("⚠️ Failed to delete from Cloudinary:", cloudinaryError);
            // Continue even if Cloudinary delete fails - still update DB
          }
        }
      } else {
        console.log('⚠️ Skipping Cloudinary deletion - not configured');
      }

      // Update requirement
      await storage.updateRequirement(requirementId, { images: updatedImages });

      res.json({ success: true, images: updatedImages });
    } catch (error: any) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gallery endpoint - Get all images grouped by events and requirements
  app.get("/api/gallery", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      const requirements = await storage.getAllRequirements();
      
      // Group requirements by event and filter only those with images
      const galleryData = events
        .map((event: any) => {
          const eventRequirements = requirements
            .filter(req => req.eventId === event.id && req.images && req.images.length > 0)
            .map(req => ({
              id: req.id,
              requirement: req.requirement,
              description: req.description,
              images: req.images || []
            }));
          
          if (eventRequirements.length === 0) return null;
          
          return {
            eventId: event.id,
            eventName: event.eventName,
            clientName: event.clientName,
            eventDate: event.eventDate,
            status: event.status,
            requirements: eventRequirements,
            totalImages: eventRequirements.reduce((sum, req) => sum + req.images.length, 0)
          };
        })
        .filter(Boolean);
      
      res.json(galleryData);
    } catch (error: any) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: error.message });
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
        planData.assetId = null;
      } else if (planData.planType === 'Team' && planData.teamMemberId) {
        // For team plans, ensure vendorId is null
        planData.vendorId = null;
        planData.assetId = null;
      } else if (planData.planType === 'Asset' && planData.assetType === 'Inventory') {
        // For team plans, ensure vendorId is null
        planData.teamMemberId = null;
        planData.vendorId = null;
      }else if (planData.planType === 'Asset' && planData.assetType === 'Temporary') {
        // For team plans, ensure vendorId is null
        planData.teamMemberId = null;
        planData.vendorId = null;
        planData.assetId = null;
      }
      
      const validatedData = insertFulfillmentPlanSchema.parse(planData);
      console.log('Creating plan for requirement with data:', JSON.stringify(validatedData, null, 2));
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

  // Plan Reviews endpoint - only allows updating review fields
  app.patch("/api/plans/:id/review", async (req, res) => {
    try {
      const planId = req.params.id;
      const { customerRating, teamRating, reviewNotes } = req.body;
      
      // Get the plan first
      const existingPlan = await storage.getFulfillmentPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({ error: "Fulfillment plan not found" });
      }
      
      // Get the requirement to find the event
      const requirement = await storage.getRequirement(existingPlan.requirementId);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      
      // Get the event to check status
      const event = await storage.getEvent(requirement.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Validate event is completed
      if (event.eventStatus !== "Completed") {
        return res.status(400).json({ error: "Reviews can only be added for completed events" });
      }
      
      // Validate ratings are between 1 and 5
      if (customerRating !== undefined && customerRating !== null && (customerRating < 1 || customerRating > 5)) {
        return res.status(400).json({ error: "Customer rating must be between 1 and 5" });
      }
      if (teamRating !== undefined && teamRating !== null && (teamRating < 1 || teamRating > 5)) {
        return res.status(400).json({ error: "Team rating must be between 1 and 5" });
      }
      
      // Update only review fields
      const updatedPlan = await storage.updateFulfillmentPlan(planId, {
        customerRating: customerRating ?? null,
        teamRating: teamRating ?? null,
        reviewNotes: reviewNotes ?? null,
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error('Error updating plan review:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to update plan review"
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

  // Catalog Items routes
  app.get("/api/catalog", async (_req, res) => {
    try {
      const items = await storage.getCatalogItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/catalog/pdf", async (req, res) => {
    try {
      const { service, package: packageType } = req.query;
      
      console.log('[PDF] Received query parameters:', { service, package: packageType });
      
      const [allCatalogItems, configuration] = await Promise.all([
        storage.getCatalogItems(),
        storage.getConfiguration(),
      ]);

      if (!configuration) {
        return res.status(404).json({ error: "Configuration not found" });
      }

      // Filter catalog items based on query parameters
      let filteredCatalogItems = allCatalogItems;
      
      if (service && typeof service === 'string' && service.trim() !== '') {
        filteredCatalogItems = filteredCatalogItems.filter(item => 
          item.serviceType === service.trim()
        );
        console.log(`[PDF] Filtered by service "${service}": ${filteredCatalogItems.length} items`);
      }
      
      if (packageType && typeof packageType === 'string' && packageType.trim() !== '') {
        filteredCatalogItems = filteredCatalogItems.filter(item => 
          item.package === packageType.trim()
        );
        console.log(`[PDF] Filtered by package "${packageType}": ${filteredCatalogItems.length} items`);
      }

      console.log(`[PDF] Final filtered catalog items: ${filteredCatalogItems.length} items`);

      const packages = configuration.packages || ['Ultra', 'Premium', 'Budget'];

      // Generate dynamic filename based on filters
      let filename = 'Dream_Day_Crew_Service_Catalog';
      if (service || packageType) {
        const servicePart = (typeof service === 'string' && service.trim() !== '') ? `_${service.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        const packagePart = (typeof packageType === 'string' && packageType.trim() !== '') ? `_${packageType.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        filename = `Dream_Day_Crew${servicePart}${packagePart}_Catalog`;
      }

      const pdfBuffer = await renderToBuffer(
        React.createElement(ServerCatalogTemplate, {
          catalogItems: filteredCatalogItems,
          configuration,
          packages,
          filterInfo: {
            service: service as string || null,
            package: packageType as string || null,
            totalItems: filteredCatalogItems.length
          }
        }) as React.ReactElement
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('[PDF] Error generating catalog PDF:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/catalog/:id", async (req, res) => {
    try {
      const item = await storage.getCatalogItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Catalog item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/catalog/service/:serviceType", async (req, res) => {
    try {
      const items = await storage.getCatalogItemsByService(req.params.serviceType);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/catalog/package/:packageName", async (req, res) => {
    try {
      const items = await storage.getCatalogItemsByPackage(req.params.packageName);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/catalog", async (req, res) => {
    try {
      const validatedData = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/catalog/:id", async (req, res) => {
    try {
      const item = await storage.updateCatalogItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Catalog item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/catalog/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCatalogItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Catalog item not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Duplicate a single catalog item
  app.post("/api/catalog/:id/duplicate", async (req, res) => {
    try {
      const sourceItem = await storage.getCatalogItem(req.params.id);
      if (!sourceItem) {
        return res.status(404).json({ error: "Catalog item not found" });
      }

      // Get overrides from request body (optional serviceType, package, itemName)
      const { serviceType, package: pkg, itemName } = req.body;
      const targetService = serviceType || sourceItem.serviceType;
      const targetPackage = pkg || sourceItem.package;

      // Get existing items to generate unique name
      const existingItems = await storage.getCatalogItems();
      const baseName = itemName || sourceItem.itemName;
      let newName = `${baseName} (Copy)`;
      let copyNumber = 1;
      
      // Find unique name
      while (existingItems.some(item => 
        item.itemName === newName && 
        item.serviceType === targetService && 
        item.package === targetPackage
      )) {
        copyNumber++;
        newName = `${baseName} (Copy ${copyNumber})`;
      }

      // Create the duplicate
      const newItem = await storage.createCatalogItem({
        serviceType: targetService,
        package: targetPackage,
        itemName: newName,
        description: sourceItem.description || undefined,
        price: sourceItem.price,
      });

      res.status(201).json(newItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Duplicate all catalog items from one service to another
  app.post("/api/catalog/duplicate-service", async (req, res) => {
    try {
      const { sourceService, targetService, packageFilter } = req.body;

      if (!sourceService || !targetService) {
        return res.status(400).json({ error: "sourceService and targetService are required" });
      }

      // Get all items from source service
      let sourceItems = await storage.getCatalogItemsByService(sourceService);
      
      // Apply package filter if provided
      if (packageFilter) {
        sourceItems = sourceItems.filter(item => item.package === packageFilter);
      }

      if (sourceItems.length === 0) {
        return res.status(400).json({ error: "No items found in source service" });
      }

      // Get existing items for naming conflict resolution
      const existingItems = await storage.getCatalogItems();
      const createdItems: any[] = [];

      for (const sourceItem of sourceItems) {
        // Generate unique name for target service
        let newName = sourceItem.itemName;
        let copyNumber = 0;
        
        while (existingItems.some(item => 
          item.itemName === newName && 
          item.serviceType === targetService && 
          item.package === sourceItem.package
        ) || createdItems.some(item =>
          item.itemName === newName &&
          item.package === sourceItem.package
        )) {
          copyNumber++;
          newName = copyNumber === 1 
            ? `${sourceItem.itemName} (Copy)` 
            : `${sourceItem.itemName} (Copy ${copyNumber})`;
        }

        const newItem = await storage.createCatalogItem({
          serviceType: targetService,
          package: sourceItem.package,
          itemName: newName,
          description: sourceItem.description || undefined,
          price: sourceItem.price,
        });
        
        createdItems.push(newItem);
      }

      res.status(201).json({ 
        message: `Successfully duplicated ${createdItems.length} items`,
        items: createdItems 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ASSET RENTAL RATES ROUTES
  // ============================================

  // Get all rental rates
  app.get("/api/rental-rates", async (req, res) => {
    try {
      const rates = await storage.getAssetRentalRates();
      res.json(rates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get rental rates for a specific asset
  app.get("/api/rental-rates/asset/:assetId", async (req, res) => {
    try {
      const rates = await storage.getAssetRentalRatesByAsset(req.params.assetId);
      res.json(rates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single rental rate
  app.get("/api/rental-rates/:id", async (req, res) => {
    try {
      const rate = await storage.getAssetRentalRate(req.params.id);
      if (!rate) return res.status(404).json({ error: "Rental rate not found" });
      res.json(rate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create rental rate
  app.post("/api/rental-rates", async (req, res) => {
    try {
      const rate = await storage.createAssetRentalRate(req.body);
      res.status(201).json(rate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update rental rate
  app.patch("/api/rental-rates/:id", async (req, res) => {
    try {
      const rate = await storage.updateAssetRentalRate(req.params.id, req.body);
      if (!rate) return res.status(404).json({ error: "Rental rate not found" });
      res.json(rate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete rental rate
  app.delete("/api/rental-rates/:id", async (req, res) => {
    try {
      const success = await storage.deleteAssetRentalRate(req.params.id);
      if (!success) return res.status(404).json({ error: "Rental rate not found" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // RENTALS ROUTES
  // ============================================

  // Get all rentals
  app.get("/api/rentals", async (req, res) => {
    try {
      const rentals = await storage.getRentals();
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single rental
  app.get("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) return res.status(404).json({ error: "Rental not found" });
      res.json(rental);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create rental
  app.post("/api/rentals", async (req, res) => {
    try {
      const rental = await storage.createRental(req.body);
      res.status(201).json(rental);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update rental
  app.patch("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.updateRental(req.params.id, req.body);
      if (!rental) return res.status(404).json({ error: "Rental not found" });
      res.json(rental);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete rental
  app.delete("/api/rentals/:id", async (req, res) => {
    try {
      const success = await storage.deleteRental(req.params.id);
      if (!success) return res.status(404).json({ error: "Rental not found" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Rental PDF (Quote or Invoice)
  app.get("/api/rentals/:id/pdf", async (req, res) => {
    console.log('📄 Rental PDF API called');
    console.log('  Rental ID:', req.params.id);
    console.log('  Type:', req.query.type);
    
    try {
      const { id } = req.params;
      const documentType = (req.query.type as string) === 'invoice' ? 'invoice' : 'quote';
      
      // Fetch rental data
      const rental = await storage.getRental(id);
      if (!rental) {
        console.error('❌ Rental not found:', id);
        return res.status(404).json({ error: "Rental not found" });
      }
      
      console.log('✅ Rental found for:', rental.customerName);
      
      // Fetch rental items
      const items = await storage.getRentalItems(id);
      console.log('✅ Rental items found:', items.length);
      
      // Fetch assets for names
      const assets = await storage.getAssets();
      console.log('✅ Assets loaded:', assets.length);
      
      // Fetch configuration
      const config = await storage.getConfiguration();
      if (!config) {
        console.error('❌ Configuration not found');
        return res.status(400).json({ error: "Configuration not found" });
      }
      
      console.log('✅ Configuration loaded');
      
      // Generate PDF
      console.log('🎨 Starting Rental PDF generation...');
      const pdfElement = RentalTemplate({
        rental,
        items,
        assets,
        config,
        documentType
      });
      
      if (!pdfElement) {
        console.error('❌ Failed to generate rental PDF template');
        return res.status(500).json({ error: "Failed to generate rental PDF template" });
      }
      
      console.log('✅ Rental PDF template generated successfully');
      
      const pdfBuffer = await renderToBuffer(pdfElement as React.ReactElement);
      console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
      
      // Set response headers for PDF download
      const typeLabel = documentType === 'quote' ? 'Quote' : 'Invoice';
      const fileName = `Rental_${typeLabel}_${rental.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('📁 Setting response headers for file:', fileName);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ Sending Rental PDF buffer to client');
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('💥 Rental PDF generation error:');
      console.error('  Error message:', error.message);
      console.error('  Error stack:', error.stack);
      res.status(500).json({ 
        error: "Failed to generate rental PDF",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ============================================
  // RENTAL ITEMS ROUTES
  // ============================================

  // Get rental items for a rental
  app.get("/api/rentals/:rentalId/items", async (req, res) => {
    try {
      const items = await storage.getRentalItems(req.params.rentalId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single rental item
  app.get("/api/rental-items/:id", async (req, res) => {
    try {
      const item = await storage.getRentalItem(req.params.id);
      if (!item) return res.status(404).json({ error: "Rental item not found" });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create rental item
  app.post("/api/rental-items", async (req, res) => {
    try {
      const item = await storage.createRentalItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update rental item
  app.patch("/api/rental-items/:id", async (req, res) => {
    try {
      const item = await storage.updateRentalItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Rental item not found" });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete rental item
  app.delete("/api/rental-items/:id", async (req, res) => {
    try {
      const success = await storage.deleteRentalItem(req.params.id);
      if (!success) return res.status(404).json({ error: "Rental item not found" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
