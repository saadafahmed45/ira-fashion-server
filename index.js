require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Serverless DB Connection Middleware for Vercel
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// For local server execution (npm run dev / node index.js)
if (require.main === module) {
  const port = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${port}`);
    });
  });
}

module.exports = app;