require("dotenv").config();
const app = require("./src/app");
const connectDB = async () => {
  try {
    const db = require("./src/config/db");
    await db();
  } catch (error) {
    console.error("Database connection failed. Exiting...", error);
    process.exit(1);
  }
};

const port = process.env.PORT || 5000;

// Connect to MongoDB Database before starting the listener
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${port}`);
  });
});