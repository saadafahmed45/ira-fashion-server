require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../modules/users/user.model");

const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@irafashion.com";
const password = process.argv[3] || "admin123456";
const name = process.argv[4] || "Admin User";

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ira-fashion";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.role = "admin";
      if (password) user.password = password;
      await user.save();
      console.log(`✅ Existing user "${email}" promoted to Admin role successfully!`);
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: "admin",
      });
      console.log(`✅ New Admin user "${email}" created successfully!`);
    }

    console.log(`
------------------------------------------------
Admin Credentials:
Email: ${email}
Password: ${password}
------------------------------------------------
    `);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
