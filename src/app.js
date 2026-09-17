require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middleware/errorMiddleware");

// Import Consolidated Feature Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration with Credentials support for Cookies
const allowedOrigins = [
  "http://localhost:3000",
  "https://ira-fashion.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
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

// HTTP Request Logger in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Cookie parser & body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = require("./config/db");

// DB Connection Middleware
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

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin/customers", userRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Root Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ira Fashion Headless eCommerce API v1.0.0 is live 🚀",
  });
});

// Fallback 404 for unmatched endpoints
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Resource not found at ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorMiddleware);

module.exports = app;
