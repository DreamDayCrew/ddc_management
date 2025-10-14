import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import {
  insertConfigurationSchema,
  insertAssetSchema,
  insertVendorSchema,
  insertTeamMemberSchema,
  insertExpenseSchema,
  insertEventSchema,
  insertRequirementSchema,
  insertFulfillmentPlanSchema,
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
    res.status(204).send();
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
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.get("/api/expenses/:id", async (req, res) => {
    const expense = await storage.getExpense(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const deleted = await storage.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(204).send();
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
      console.log('Validation passed, creating event with:', JSON.stringify(validatedData, null, 2));
      const event = await storage.createEvent(validatedData);
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

  app.delete("/api/events/:id", async (req, res) => {
    const deleted = await storage.deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
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
      const requirement = await storage.updateRequirement(req.params.id, req.body);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      res.json(requirement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/requirements/:id", async (req, res) => {
    const deleted = await storage.deleteRequirement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Requirement not found" });
    }
    res.status(204).send();
  });

  // Fulfillment Plan routes
  app.get("/api/plans", async (_req, res) => {
    const plans = await storage.getAllFulfillmentPlans();
    res.json(plans);
  });

  app.get("/api/requirements/:requirementId/plans", async (req, res) => {
    const plans = await storage.getFulfillmentPlans(req.params.requirementId);
    res.json(plans);
  });

  app.get("/api/plans/:id", async (req, res) => {
    const plan = await storage.getFulfillmentPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: "Fulfillment plan not found" });
    }
    res.json(plan);
  });

  app.post("/api/plans", async (req, res) => {
    try {
      console.log('Creating plan with data:', JSON.stringify(req.body, null, 2));
      const validatedData = insertFulfillmentPlanSchema.parse(req.body);
      console.log('Validation passed, creating plan with:', JSON.stringify(validatedData, null, 2));
      const plan = await storage.createFulfillmentPlan(validatedData);
      res.status(201).json(plan);
    } catch (error: any) {
      console.error('Plan creation failed:', error.message);
      console.error('Full error:', error);
      if (error.issues) {
        console.error('Validation issues:', JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/plans/:id", async (req, res) => {
    try {
      const plan = await storage.updateFulfillmentPlan(req.params.id, req.body);
      if (!plan) {
        return res.status(404).json({ error: "Fulfillment plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/plans/:id", async (req, res) => {
    const deleted = await storage.deleteFulfillmentPlan(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Fulfillment plan not found" });
    }
    res.status(204).send();
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

          // Calculate total invoice value (sum of all requirement invoice values)
          const totalRequirementInvoiceValue = requirements.reduce(
            (sum: number, req) => sum + Number(req.order || 0),
            0
          );

          // Calculate actual spent for each requirement
          const requirementBreakdown = await Promise.all(
            requirements.map(async (req) => {
              const plans = await storage.getFulfillmentPlans(req.id);
              
              // Sum all costs from plans
              const actualSpent = plans.reduce((sum: number, plan) => {
                const payment = Number(plan.payment || 0);
                const vendorAmount = Number(plan.vendorAmount || 0);
                const purchasedValue = Number(plan.purchasedValue || 0);
                return sum + payment + vendorAmount + purchasedValue;
              }, 0);

              const invoiceValue = Number(req.order || 0);
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

          // Calculate overall variance
          const finalizedQuote = Number(event.finalizedQuote || event.initialQuote || 0);
          const variance = finalizedQuote - totalActualSpent;
          const variancePercentage = finalizedQuote > 0
            ? (variance / finalizedQuote) * 100
            : 0;

          return {
            eventId: event.id,
            eventName: event.eventName,
            eventDate: event.eventDate,
            venue: event.venue,
            finalizedQuote,
            totalRequirementInvoiceValue,
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
