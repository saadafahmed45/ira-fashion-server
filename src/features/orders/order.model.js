const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      zip: String,
      country: { type: String, default: "Bangladesh" },
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: { type: String, required: true },
        image: String,
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        variant: {
          size: String,
          color: String,
          sku: String,
        },
      },
    ],
    pricing: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, default: 10 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    coupon: {
      code: String,
      discount: Number,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "bkash"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    tracking: {
      carrier: String,
      number: String,
      url: String,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
