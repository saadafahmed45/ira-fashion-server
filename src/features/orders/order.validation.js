const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({
    customer: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(1, "Phone is required"),
    }),
    shippingAddress: z.object({
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().default("Bangladesh"),
    }),
    products: z.array(
      z.object({
        productId: z.string().min(24, "Invalid product ID"),
        title: z.string().min(1, "Product title is required"),
        image: z.string().optional(),
        price: z.number().min(0, "Price must be positive"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        variant: z.object({
          size: z.string(),
          color: z.string().optional(),
          sku: z.string().optional(),
        }).optional(),
      })
    ).min(1, "Order must contain at least one product"),
    coupon: z.object({
      code: z.string(),
      discount: z.number().min(0),
    }).optional(),
    paymentMethod: z.enum(["cod", "card", "bkash"]).default("cod"),
    notes: z.string().optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(24, "Invalid order id format"),
  }),
  body: z.object({
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
