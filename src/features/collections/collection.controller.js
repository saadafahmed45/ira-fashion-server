const Collection = require("./collection.model");
const Product = require("../products/product.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Get all collections
 */
const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find().sort("-createdAt").lean();
  return ApiResponse.success(res, collections, "Collections fetched successfully");
});

/**
 * Get single collection by ID or Slug
 */
const getCollectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let collection;
  const populateOpts = {
    path: "productIds",
    select: "title slug price compareAtPrice vendor images stock status",
  };

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    collection = await Collection.findById(id).populate(populateOpts).lean();
  } else {
    collection = await Collection.findOne({ slug: id }).populate(populateOpts).lean();
  }

  if (!collection) {
    return ApiResponse.error(res, "Collection not found", 404);
  }

  return ApiResponse.success(res, collection, "Collection fetched successfully");
});

/**
 * Create new collection (Admin only)
 */
const createCollection = asyncHandler(async (req, res) => {
  const imageUrl = req.file?.path || "";

  const collectionData = {
    ...req.body,
    imageUrl,
  };

  const collection = new Collection(collectionData);
  await collection.save();

  // Link selected products to this collection
  if (collection.productIds?.length > 0) {
    await Product.updateMany(
      { _id: { $in: collection.productIds } },
      { $addToSet: { collectionIds: collection._id } }
    );
  }

  return ApiResponse.success(res, collection, "Collection created successfully", 201);
});

/**
 * Update collection (Admin only)
 */
const updateCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const collection = await Collection.findById(id);

  if (!collection) {
    return ApiResponse.error(res, "Collection not found", 404);
  }

  const imageUrl = req.file?.path;
  const updatedData = { ...req.body };
  if (imageUrl) {
    updatedData.imageUrl = imageUrl;
  }

  // Handle product references syncing
  const oldProductIds = collection.productIds.map((pId) => pId.toString());
  const newProductIds = req.body.productIds || [];

  const productsToAdd = newProductIds.filter((pId) => !oldProductIds.includes(pId));
  const productsToRemove = oldProductIds.filter((pId) => !newProductIds.includes(pId));

  const updatedCollection = await Collection.findByIdAndUpdate(
    id,
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  // Sync products additions
  if (productsToAdd.length > 0) {
    await Product.updateMany(
      { _id: { $in: productsToAdd } },
      { $addToSet: { collectionIds: id } }
    );
  }

  // Sync products removals
  if (productsToRemove.length > 0) {
    await Product.updateMany(
      { _id: { $in: productsToRemove } },
      { $pull: { collectionIds: id } }
    );
  }

  return ApiResponse.success(res, updatedCollection, "Collection updated successfully");
});

/**
 * Delete collection (Admin only)
 */
const deleteCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const collection = await Collection.findByIdAndDelete(id);

  if (!collection) {
    return ApiResponse.error(res, "Collection not found", 404);
  }

  // Remove collection ID from product records
  await Product.updateMany(
    { collectionIds: id },
    { $pull: { collectionIds: id } }
  );

  return ApiResponse.success(res, null, "Collection deleted successfully");
});

module.exports = {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
