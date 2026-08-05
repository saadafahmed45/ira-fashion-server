const mongoose = require("mongoose");
const slugify = require("slugify");

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "#6366f1",
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  sku: {
    type: String,
    trim: true,
  },
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
      required: [true, "Product price is required"],
      min: 0,
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
      default: "draft",
      index: true,
    },
    images: [
      {
        type: String, // URLs of Cloudinary
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate product slug automatically
productSchema.pre("save", function () {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 10000);
  }
});

module.exports = mongoose.model("Product", productSchema);
