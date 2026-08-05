const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.58zpnyp.mongodb.net/${process.env.DB_NAME || "productsDb"}?retryWrites=true&w=majority`;

    const conn = await mongoose.connect(connStr, {
      // Connection pool — supports high-concurrency production load
      maxPoolSize: 50,
      minPoolSize: 10,
      // Timeout config — prevents hanging connections on Atlas failover
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      // Always create indexes declared in schemas (safe for dev + production)
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
