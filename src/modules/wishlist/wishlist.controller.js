const wishlistService = require("./wishlist.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  return ApiResponse.success(res, wishlist, "Wishlist fetched successfully");
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addToWishlist(req.user.id, productId);
  return ApiResponse.success(res, wishlist, "Product added to wishlist");
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await wishlistService.removeFromWishlist(req.user.id, productId);
  return ApiResponse.success(res, wishlist, "Product removed from wishlist");
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
