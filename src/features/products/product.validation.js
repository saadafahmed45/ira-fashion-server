const { z } = require("zod");

const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Product title is required"),
    description: z.string().min(1, "Product description is required"),
    price: z.preprocess((val) => Number(val), z.number().min(0, "Price must be positive")),
    compareAtPrice: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).optional()),
    vendor: z.string().optional(),
    productType: z.string().optional(),
    tags: z.preprocess(
      (val) => (typeof val === "string" ? val.split(",").map((t) => t.trim()) : val),
      z.array(z.string()).optional()
    ),
    variants: z.preprocess(
      (val) => (typeof val === "string" ? JSON.parse(val) : val),
      z.array(
        z.object({
          size: z.string().min(1, "Size is required"),
          color: z.string().optional(),
          stock: z.number().min(0, "Stock must be positive").default(0),
          price: z.number().min(0, "Variant price must be positive").default(0),
          sku: z.string().optional(),
        })
      ).optional()
    ),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    weight: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
    status: z.enum(["draft", "active", "archived"]).default("draft"),
    collectionIds: z.preprocess(
      (val) => (typeof val === "string" ? val.split(",").map((id) => id.trim()).filter(Boolean) : val),
      z.array(z.string()).optional()
    ),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(24, "Invalid product id format"),
  }),
  body: createProductSchema.shape.body.partial(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
