const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    photoURL: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
    },
    phone: {
      type: String,
      trim: true,
    },
    addresses: [
      {
        label: { type: String, default: "Home" }, // Home, Office
        street: String,
        city: String,
        state: String,
        zip: String,
        country: { type: String, default: "Bangladesh" },
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

module.exports = mongoose.model("User", userSchema);
