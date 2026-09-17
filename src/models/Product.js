const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price must be greater than or equal to 0"],
      index: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      index: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      default: "Ira Fashion",
    },
    stock: {
      type: Number,
      required: [true, "Stock count is required"],
      default: 0,
      min: 0,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search text index
productSchema.index({ name: "text", description: "text", brand: "text" });

// Auto-generate slug
productSchema.pre("save", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) +
      "-" +
      Math.floor(1000 + Math.random() * 9000);
  }
});

module.exports = mongoose.model("Product", productSchema);
