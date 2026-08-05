const Product = require("./product.model");
const Collection = require("../collections/collection.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const QueryBuilder = require("../../utils/queryBuilder");

/**
 * Get all products (supports Search, Sort, Filter, Paginate)
 */
const getProducts = asyncHandler(async (req, res) => {
  const allowedFilters = ["status", "productType", "vendor", "collectionIds"];
  const builder = new QueryBuilder(Product, req.query);

  const results = await builder
    .search(["title", "description", "vendor", "productType"])
    .filterByFields(allowedFilters)
    .execute();

  return ApiResponse.success(res, results.data, "Products fetched successfully", 200, results.meta);
});

/**
 * Get single product by ID or Slug
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let product;
  // Check if param is valid mongoose ObjectId, else find by slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(id).populate("collectionIds", "name slug");
  } else {
    product = await Product.findOne({ slug: id }).populate("collectionIds", "name slug");
  }

  if (!product) {
    return ApiResponse.error(res, "Product not found", 404);
  }

  return ApiResponse.success(res, product, "Product fetched successfully");
});

/**
 * Create new product (Admin only)
 */
const createProduct = asyncHandler(async (req, res) => {
  const imageUrls = req.files?.map((f) => f.path) || [];
  
  const productData = {
    ...req.body,
    images: imageUrls,
  };

  const product = new Product(productData);
  await product.save();

  // If collection IDs are provided, link product to collections
  if (product.collectionIds?.length > 0) {
    await Collection.updateMany(
      { _id: { $in: product.collectionIds } },
      { $addToSet: { productIds: product._id } }
    );
  }

  return ApiResponse.success(res, product, "Product created successfully", 201);
});

/**
 * Update existing product (Admin only)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return ApiResponse.error(res, "Product not found", 404);
  }

  // Handle uploaded images if any
  const uploadedImages = req.files?.map((f) => f.path) || [];
  const updatedData = { ...req.body };

  if (uploadedImages.length > 0) {
    // If client is overriding images completely:
    updatedData.images = uploadedImages;
  }

  // Get difference in collectionIds to keep references sync'd
  const oldCollectionIds = product.collectionIds.map((cId) => cId.toString());
  const newCollectionIds = req.body.collectionIds || [];

  const collectionsToAdd = newCollectionIds.filter((cId) => !oldCollectionIds.includes(cId));
  const collectionsToRemove = oldCollectionIds.filter((cId) => !newCollectionIds.includes(cId));

  // Perform product update
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  // Sync collections additions
  if (collectionsToAdd.length > 0) {
    await Collection.updateMany(
      { _id: { $in: collectionsToAdd } },
      { $addToSet: { productIds: id } }
    );
  }

  // Sync collections removals
  if (collectionsToRemove.length > 0) {
    await Collection.updateMany(
      { _id: { $in: collectionsToRemove } },
      { $pull: { productIds: id } }
    );
  }

  return ApiResponse.success(res, updatedProduct, "Product updated successfully");
});

/**
 * Delete product (Admin only)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return ApiResponse.error(res, "Product not found", 404);
  }

  // Remove references from collections
  await Collection.updateMany(
    { productIds: id },
    { $pull: { productIds: id } }
  );

  return ApiResponse.success(res, null, "Product deleted successfully");
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
