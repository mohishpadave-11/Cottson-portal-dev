import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import initSuperAdmin from "./utils/initSuperAdmin.js";
// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admins.js";
import companyRoutes from "./routes/companies.js";
import clientRoutes from "./routes/clients.js";
import orderRoutes from "./routes/orders.js";
import productRoutes from "./routes/products.js";
import collectionRoutes from "./routes/collections.js";
import complaintRoutes from "./routes/complaints.js";
import statsRoutes from "./routes/stats.js";
import uploadRoutes from "./routes/upload.js";
import notificationRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration for production
// Production-grade CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003', // Future proofing
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Check if origin is allowed or if it's a localhost origin (dynamic port) or a Vercel deployment
    const isAllowed = allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health check endpoint for Render
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "server/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err);
  // Close server & exit process
  process.exit(1);
});

mongoose
  .connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Initialize SuperAdmin on first start
    await initSuperAdmin();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("\n⚠️  Make sure MongoDB is running:");
    console.log("   - Install MongoDB: https://www.mongodb.com/try/download/community");
    console.log("   - Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas");
    console.log("   - Update MONGODB_URI in .env file\n");
  });

app.use("/api/auth", authRoutes); // Authentication
app.use("/api/admins", adminRoutes); // Admin Management (SuperAdmin)
app.use("/api/companies", companyRoutes); // Company Management
app.use("/api/clients", clientRoutes); // Client Management
app.use("/api/orders", orderRoutes); // Order Management
app.use("/api/products", productRoutes); // Product Management
app.use("/api/collections", collectionRoutes); // Collection Management
app.use("/api/complaints", complaintRoutes); // Complaint Management
app.use("/api/stats", statsRoutes); // Statistics
app.use("/api/upload", uploadRoutes); // Direct Uploads
app.use("/api/notifications", notificationRoutes); // Notifications
app.use("/api/settings", settingsRoutes); // Settings


// Swagger API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpecs);
});

// 404 Handler for API routes - specific to prevent HTML responses
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error Stack:', err.stack);
  console.error('❌ Server Error Message:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
