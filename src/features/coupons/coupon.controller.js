const Coupon = require("./coupon.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Validate code and check conditions (amount, uses, expiry)
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;

  if (!code) {
    return ApiResponse.error(res, "Coupon code is required", 400);
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    return ApiResponse.error(res, "Invalid or inactive coupon code", 404);
  }

  // Check expiry
  if (new Date() > coupon.expiresAt) {
    return ApiResponse.error(res, "This coupon has expired", 400);
  }

  // Check usage limit
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return ApiResponse.error(res, "This coupon usage limit has been reached", 400);
  }

  // Check order value threshold
  if (amount && amount < coupon.minOrderAmount) {
    return ApiResponse.error(res, `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`, 400);
  }

  // Calculate discount
  let discount = 0;
  if (amount) {
    if (coupon.type === "percentage") {
      discount = (amount * coupon.value) / 100;
    } else {
      discount = Math.min(coupon.value, amount);
    }
  }

  return ApiResponse.success(
    res,
    {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
    },
    "Coupon validated successfully"
  );
});

module.exports = {
  validateCoupon,
};
