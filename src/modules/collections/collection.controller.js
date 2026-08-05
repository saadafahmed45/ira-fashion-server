const collectionService = require("./collection.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const getCollections = asyncHandler(async (req, res) => {
  const result = await collectionService.getAllCollections(req.query);
  return ApiResponse.success(res, result.data, "Collections fetched", 200, result.meta);
});

const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await collectionService.getCollectionByIdOrSlug(req.params.id);
  return ApiResponse.success(res, collection, "Collection details fetched");
});

const createCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.createCollection(req.body, req.file);
  return ApiResponse.success(res, collection, "Collection created", 201);
});

const updateCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.updateCollection(req.params.id, req.body, req.file);
  return ApiResponse.success(res, collection, "Collection updated");
});

const deleteCollection = asyncHandler(async (req, res) => {
  await collectionService.deleteCollection(req.params.id);
  return ApiResponse.success(res, null, "Collection deleted");
});

module.exports = {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
