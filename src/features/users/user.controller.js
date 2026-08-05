const User = require("./user.model");
const Order = require("../orders/order.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Get current user profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }
  return ApiResponse.success(res, user, "Profile fetched successfully");
});

/**
 * Update current user profile
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (addresses !== undefined) updateData.addresses = addresses;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }

  return ApiResponse.success(res, user, "Profile updated successfully");
});

/**
 * Get current user orders list
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "customer.userId": req.user.id }).sort("-createdAt");
  return ApiResponse.success(res, orders, "Orders fetched successfully");
});

module.exports = {
  getMe,
  updateMe,
  getMyOrders,
};
