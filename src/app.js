require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { apiLimiter } = require("./common/middleware/rateLimit.middleware");
const errorHandler = require("./common/middleware/error.middleware");

// Import Modular Routes
const authRoutes = require("./modules/auth/auth.routes");
const productRoutes = require("./modules/products/product.routes");
const orderRoutes = require("./modules/orders/order.routes");
const collectionRoutes = require("./modules/collections/collection.routes");
const wishlistRoutes = require("./modules/wishlist/wishlist.routes");
const adminRoutes = require("./modules/admin/admin.routes");

const app = express();

// Security Headers
app.use(helmet());

// CORS Whitelist
const allowedOrigins = [
  "http://localhost:3000",
  "https://ira-fashion.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman/curl) or allowed origins or any vercel.app domain
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// HTTP Request Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Cookie parser & body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require("./config/db");

// DB Connection Middleware for Serverless (Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// Apply rate limiting
app.use("/api/", apiLimiter);

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/collections", collectionRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/admin", adminRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ira's Fashion Headless eCommerce API v1.0.0 is live 🚀",
  });
});

// Fallback for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Resource not found at ${req.originalUrl}`,
  });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
