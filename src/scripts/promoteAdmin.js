require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../modules/users/user.model");

async function promoteAdmin() {
  try {
    const connStr = process.env.MONGO_URI && !process.env.MONGO_URI.includes("cluster0.mongodb.net")
      ? process.env.MONGO_URI
      : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.58zpnyp.mongodb.net/${process.env.DB_NAME || "productsDb"}?retryWrites=true&w=majority`;

    await mongoose.connect(connStr);
    console.log("Connected to MongoDB...");

    const adminEmail = (process.env.ADMIN_EMAIL || "mohammadhaolader1@gmail.com").trim().toLowerCase();
    
    const result = await User.updateMany(
      { email: new RegExp(`^${adminEmail}$`, "i") },
      { $set: { role: "admin" } }
    );

    console.log(`Updated ${result.modifiedCount || result.nModified || 0} user(s) with email "${adminEmail}" to admin role!`);

    const users = await User.find({ email: new RegExp(`^${adminEmail}$`, "i") });
    console.log("Current user records in MongoDB:", users);

    process.exit(0);
  } catch (err) {
    console.error("Error promoting admin:", err);
    process.exit(1);
  }
}

promoteAdmin();
