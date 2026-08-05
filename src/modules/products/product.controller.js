const productService = require("./product.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  return ApiResponse.success(res, result.data, "Products fetched successfully", 200, result.meta);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductByIdOrSlug(req.params.id);
  return ApiResponse.success(res, product, "Product fetched successfully");
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files || []);
  return ApiResponse.success(res, product, "Product created successfully", 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files || []);
  return ApiResponse.success(res, product, "Product updated successfully");
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  return ApiResponse.success(res, null, "Product deleted successfully");
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
