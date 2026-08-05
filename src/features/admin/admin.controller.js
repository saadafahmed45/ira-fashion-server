const Product = require("../products/product.model");
const Order = require("../orders/order.model");
const User = require("../users/user.model");
const Coupon = require("../coupons/coupon.model");
const Review = require("../reviews/review.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Get dashboard analytics statistics (KPIs, revenue charts data, top categories)
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    totalOrders,
    totalCustomers,
    pendingOrders,
    completedOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "delivered" }),
  ]);

  // Calculate revenue
  const orders = await Order.find({ paymentStatus: "paid" });
  const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

  // Get recent orders list
  const recentOrders = await Order.find()
    .sort("-createdAt")
    .limit(5)
    .populate("customer.userId", "name");

  // Get active products count vs draft products count
  const activeProducts = await Product.countDocuments({ status: "active" });
  const draftProducts = await Product.countDocuments({ status: "draft" });

  return ApiResponse.success(res, {
    totalProducts,
    totalOrders,
    totalCustomers,
    pendingOrders,
    completedOrders,
    totalRevenue,
    activeProducts,
    draftProducts,
    recentOrders,
  }, "Dashboard stats compiled successfully");
});

/**
 * Get all orders (with pagination and filtering)
 */
const getAdminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)
    .populate("customer.userId", "name email");

  const totalPages = Math.ceil(total / limit);

  return ApiResponse.success(res, orders, "Orders fetched successfully", 200, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

/**
 * Get all customers
 */
const getAdminCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = { role: "customer" };

  const total = await User.countDocuments(filter);
  const customers = await User.find(filter)
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit);

  return ApiResponse.success(res, customers, "Customers fetched successfully", 200, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

/**
 * Update user role
 */
const updateCustomerRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["customer", "staff", "admin"].includes(role)) {
    return ApiResponse.error(res, "Invalid role specified", 400);
  }

  const user = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true });
  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }

  return ApiResponse.success(res, user, `User role updated to ${role} successfully`);
});

/**
 * Get all coupons
 */
const getAdminCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  return ApiResponse.success(res, coupons, "Coupons fetched successfully");
});

/**
 * Create new coupon
 */
const createAdminCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrderAmount, maxUses, expiresAt } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    return ApiResponse.error(res, "Coupon with this code already exists", 400);
  }

  const coupon = new Coupon({
    code: code.toUpperCase(),
    type,
    value,
    minOrderAmount,
    maxUses,
    expiresAt: new Date(expiresAt),
  });

  await coupon.save();

  return ApiResponse.success(res, coupon, "Coupon created successfully", 201);
});

/**
 * Get review queue for moderation
 */
const getAdminReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("productId", "title")
    .populate("userId", "name email")
    .sort("-createdAt");
  return ApiResponse.success(res, reviews, "Reviews fetched successfully");
});

/**
 * Approve or reject review
 */
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, rejected

  if (!["approved", "rejected"].includes(status)) {
    return ApiResponse.error(res, "Invalid review status", 400);
  }

  const review = await Review.findById(id);
  if (!review) {
    return ApiResponse.error(res, "Review not found", 404);
  }

  review.status = status;
  await review.save();

  // If approved, update product average ratings
  if (status === "approved") {
    const product = await Product.findById(review.productId);
    if (product) {
      const allApprovedReviews = await Review.find({ productId: product._id, status: "approved" });
      const totalRatings = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = {
        average: totalRatings / (allApprovedReviews.length || 1),
        count: allApprovedReviews.length,
      };
      await product.save();
    }
  }

  return ApiResponse.success(res, review, `Review successfully marked as ${status}`);
});

module.exports = {
  getStats,
  getAdminOrders,
  getAdminCustomers,
  updateCustomerRole,
  getAdminCoupons,
  createAdminCoupon,
  getAdminReviews,
  updateReviewStatus,
};
