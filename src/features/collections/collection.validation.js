const { z } = require("zod");

const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Collection name is required"),
    description: z.string().min(1, "Collection description is required"),
    productIds: z.preprocess(
      (val) => (typeof val === "string" ? val.split(",").map((id) => id.trim()).filter(Boolean) : val),
      z.array(z.string()).optional()
    ),
  }),
});

const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string().min(24, "Invalid collection id format"),
  }),
  body: createCollectionSchema.shape.body.partial(),
});

module.exports = {
  createCollectionSchema,
  updateCollectionSchema,
};
