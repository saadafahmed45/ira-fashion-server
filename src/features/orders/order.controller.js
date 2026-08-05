const Order = require("./order.model");
const Product = require("../products/product.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { sendOrderConfirmationEmail } = require("../../utils/email");

/**
 * Place new order (calculates pricing, checks and updates variant stock)
 */
const createOrder = asyncHandler(async (req, res) => {
  const { customer, shippingAddress, products, paymentMethod, coupon, notes } = req.body;

  // 1. Calculate pricing and deduct stock
  let subtotal = 0;
  const processedProducts = [];

  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return ApiResponse.error(res, `Product ${item.title} not found`, 400);
    }

    // Verify stock and update inventory if variant matches
    if (item.variant && item.variant.size) {
      const dbVariant = product.variants.find(
        (v) => v.size === item.variant.size && (item.variant.color ? v.color === item.variant.color : true)
      );

      if (dbVariant) {
        if (dbVariant.stock < item.quantity) {
          return ApiResponse.error(res, `Insufficient stock for product variant: ${item.title} (${item.variant.size})`, 400);
        }
        // Deduct variant stock
        dbVariant.stock -= item.quantity;
      }
    }

    // Increment product sales
    product.totalSold += item.quantity;
    await product.save();

    subtotal += item.price * item.quantity;

    processedProducts.push({
      productId: item.productId,
      title: item.title,
      image: item.image || (product.images?.length > 0 ? product.images[0] : ""),
      price: item.price,
      quantity: item.quantity,
      variant: item.variant,
    });
  }

  // Calculate taxes and shipping
  const shipping = 10;
  const tax = 0;
  const discount = coupon ? coupon.discount : 0;
  const total = subtotal + shipping + tax - discount;

  // Generate unique order number
  const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);

  // Link authenticated user to order if logged in
  const userId = req.user ? req.user.id : null;

  const orderData = {
    orderNumber,
    customer: {
      userId,
      ...customer,
    },
    shippingAddress,
    products: processedProducts,
    pricing: {
      subtotal,
      shipping,
      tax,
      discount,
      total,
    },
    coupon,
    paymentMethod,
    notes,
  };

  const order = new Order(orderData);
  await order.save();

  // Send asynchronous order confirmation email
  sendOrderConfirmationEmail({
    customerName: customer.name,
    email: customer.email,
    totalPrice: total,
    products: processedProducts,
  }).catch((err) => console.error("❌ Send confirmation email failed:", err.message));

  return ApiResponse.success(res, order, "Order placed successfully", 201);
});

/**
 * Get single order details
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate("customer.userId", "name email");

  if (!order) {
    return ApiResponse.error(res, "Order not found", 404);
  }

  // If not admin and doesn't own this order
  if (req.user.role !== "admin" && order.customer.userId?.toString() !== req.user.id) {
    return ApiResponse.error(res, "Access denied", 403);
  }

  return ApiResponse.success(res, order, "Order fetched successfully");
});

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return ApiResponse.error(res, "Order not found", 404);
  }

  order.status = status;
  // If order delivered, set payment status to paid for COD
  if (status === "delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }

  await order.save();

  return ApiResponse.success(res, order, "Order status updated successfully");
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
};
