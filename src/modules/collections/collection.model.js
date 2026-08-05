const mongoose = require("mongoose");
const slugify = require("slugify");

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: String,
    image: String,
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.virtual("imageUrl").get(function () {
  return this.image || "";
});

collectionSchema.set("toJSON", { virtuals: true });
collectionSchema.set("toObject", { virtuals: true });

collectionSchema.pre("save", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

module.exports = mongoose.model("Collection", collectionSchema);
