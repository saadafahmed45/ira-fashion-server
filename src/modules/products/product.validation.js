const { z } = require("zod");

const createProductSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(2),
    description: z.string({ required_error: "Description is required" }).min(5),
    price: z.coerce.number({ required_error: "Price is required" }).nonnegative(),
    compareAtPrice: z.coerce.number().optional(),
    vendor: z.string().optional(),
    productType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
    images: z.array(z.string()).optional(),
    options: z
      .array(
        z.object({
          name: z.string(),
          values: z.array(z.string()),
        })
      )
      .optional(),
    variants: z
      .array(
        z.object({
          name: z.string(),
          price: z.coerce.number(),
          compareAtPrice: z.coerce.number().optional(),
          stock: z.coerce.number().optional(),
          sku: z.string().optional(),
          image: z.string().optional(),
          options: z.record(z.string()).optional(),
        })
      )
      .optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    weight: z.coerce.number().optional(),
    collectionIds: z.array(z.string()).optional(),
  }),
});

module.exports = {
  createProductSchema,
};
