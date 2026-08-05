const adminService = require("./admin.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const getAnalytics = asyncHandler(async (req, res) => {
  const metrics = await adminService.getDashboardMetrics();
  return ApiResponse.success(res, metrics, "Dashboard metrics fetched");
});

module.exports = {
  getAnalytics,
};
