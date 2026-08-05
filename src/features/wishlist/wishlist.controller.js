const User = require("../users/user.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Get user wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("wishlist");
  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }
  return ApiResponse.success(res, user.wishlist, "Wishlist fetched successfully");
});

/**
 * Toggle product inside user wishlist array
 */
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user.id);

  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }

  const isWishlisted = user.wishlist.includes(productId);
  if (isWishlisted) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();

  return ApiResponse.success(
    res,
    { isWishlisted: !isWishlisted },
    isWishlisted ? "Removed from wishlist" : "Added to wishlist"
  );
});

module.exports = {
  getWishlist,
  toggleWishlist,
};
