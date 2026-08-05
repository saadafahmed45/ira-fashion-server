const orderService = require("./order.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const getOrders = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    const result = await orderService.getAllOrders(req.query);
    return ApiResponse.success(res, result.data, "Orders fetched successfully", 200, result.meta);
  }
  const result = await orderService.getUserOrders(req.user.id, req.query);
  return ApiResponse.success(res, result.data, "User orders fetched successfully", 200, result.meta);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  if (req.user.role !== "admin" && order.customer?.userId?.toString() !== req.user.id.toString()) {
    return ApiResponse.error(res, "Access denied", 403);
  }
  return ApiResponse.success(res, order, "Order details fetched");
});

const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const order = await orderService.trackOrder(orderNumber);
  return ApiResponse.success(res, order, "Order tracking details fetched");
});

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const order = await orderService.createOrder(req.body, userId);
  return ApiResponse.success(res, order, "Order created successfully", 201);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, paymentStatus);
  return ApiResponse.success(res, order, "Order status updated");
});

const deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  return ApiResponse.success(res, null, "Order deleted successfully");
});

module.exports = {
  getOrders,
  getOrderById,
  trackOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
