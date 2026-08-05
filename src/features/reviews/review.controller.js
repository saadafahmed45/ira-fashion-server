const Review = require("./review.model");
const Product = require("../products/product.model");
const Order = require("../orders/order.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Get approved reviews for a product
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ productId, status: "approved" })
    .populate("userId", "name photoURL")
    .sort("-createdAt");
  return ApiResponse.success(res, reviews, "Product reviews fetched successfully");
});

/**
 * Create a product review (Logged in users)
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, body } = req.body;
  const userId = req.user.id;

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({ productId, userId });
  if (existingReview) {
    return ApiResponse.error(res, "You have already reviewed this product", 400);
  }

  // Check if purchase is verified (user has delivered order containing product)
  const deliveredOrder = await Order.findOne({
    "customer.userId": userId,
    status: "delivered",
    "products.productId": productId,
  });

  const review = new Review({
    productId,
    userId,
    rating,
    title,
    body,
    isVerifiedPurchase: !!deliveredOrder,
    status: "pending", // require admin approval by default
  });

  await review.save();

  return ApiResponse.success(res, review, "Review submitted and is awaiting approval", 201);
});

module.exports = {
  getProductReviews,
  createReview,
};
