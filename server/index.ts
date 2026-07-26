import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();

// Enable CORS for mobile app connections
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log all incoming requests
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`🌐 Headers:`, {
    'user-agent': req.headers['user-agent'],
    'origin': req.headers.origin,
    'referer': req.headers.referer,
    'accept': req.headers.accept
  });
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`🌐 Query params:`, req.query);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  try {
    await seedDatabase();
    log("Database seeded successfully");
  } catch (error) {
    log("Database seeding skipped or failed: " + String(error));
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Render provides PORT automatically, default to 10000 for Render compatibility
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || '10000', 10);
  
  // Test database connection
  const testDbConnection = async () => {
    try {
      if (process.env.DATABASE_URL) {
        const { DatabaseStorage } = await import('./database-storage');
        const dbStorage = new DatabaseStorage();
        const isConnected = await dbStorage.testConnection();
        log(`💾 Database: ${isConnected ? 'Connected (Neon)' : 'Connection Failed'}`);
      } else {
        log(`💾 Database: Using Memory Storage`);
      }
    } catch (error) {
      log(`💾 Database: Connection Error - ${error}`);
    }
  };
  
  server.listen(port, '0.0.0.0', async () => {
    log(`🚀 Server running on port ${port}`);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    await testDbConnection();
  });
})();
