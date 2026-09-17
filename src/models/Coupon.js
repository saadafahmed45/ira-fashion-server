const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Discount amount is required"],
      min: [0, "Amount must be positive"],
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.methods.isValid = function (purchaseAmount = 0) {
  const isExpired = new Date() > this.expiryDate;
  if (!this.isActive || isExpired) return false;
  if (purchaseAmount < this.minPurchase) return false;
  return true;
};

module.exports = mongoose.model("Coupon", couponSchema);
