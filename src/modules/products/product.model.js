const mongoose = require("mongoose");
const slugify = require("slugify");

// Generic Shopify-style Option schema (e.g. Name: "Size", Values: ["S", "M", "L"])
const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    values: [{ type: String, trim: true }],
  },
  { _id: false }
);

// Generic Shopify-style Variant schema (e.g. Name: "Black / 50ml", price, stock, sku, options map)
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. "50ml", "Red / XL"
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, trim: true },
  barcode: { type: String, trim: true },
  image: { type: String }, // Variant-specific image URL
  options: { type: Map, of: String }, // e.g. { Size: "XL", Color: "Red" }
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Base product price is required"],
      min: 0,
      index: true,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    vendor: {
      type: String,
      trim: true,
      default: "Ira Fashion",
    },
    productType: {
      type: String,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      index: true,
    },
    images: [
      {
        type: String, // Array of image URLs
      },
    ],
    options: [optionSchema],
    variants: [variantSchema],
    sku: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    collectionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
        index: true,
      },
    ],
    totalSold: {
      type: Number,
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast full-text search
productSchema.index({ title: "text", description: "text", vendor: "text", productType: "text", tags: "text" });

// Pre-save hook to generate product slug automatically
productSchema.pre("save", function () {
  if (this.isModified("title") && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 10000);
  }
});

module.exports = mongoose.model("Product", productSchema);
