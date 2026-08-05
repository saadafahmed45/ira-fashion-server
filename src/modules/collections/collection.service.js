const collectionRepository = require("./collection.repository");
const ApiError = require("../../common/errors/ApiError");

class CollectionService {
  async getAllCollections(queryParams) {
    return await collectionRepository.findAll(queryParams);
  }

  async getCollectionByIdOrSlug(idOrSlug) {
    const collection = await collectionRepository.findByIdOrSlug(idOrSlug);
    if (!collection) {
      throw new ApiError(404, "Collection not found");
    }
    return collection;
  }

  sanitizeData(data) {
    const sanitized = { ...data };
    
    // Parse productIds from comma-separated string or JSON array
    if (typeof sanitized.productIds === "string") {
      try {
        sanitized.productIds = JSON.parse(sanitized.productIds);
      } catch {
        sanitized.productIds = sanitized.productIds.split(",").map((s) => s.trim());
      }
    }
    
    if (Array.isArray(sanitized.productIds)) {
      sanitized.productIds = sanitized.productIds.filter(
        (id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)
      );
    } else {
      delete sanitized.productIds;
    }

    return sanitized;
  }

  async createCollection(data, uploadedFile) {
    const sanitized = this.sanitizeData(data);
    const imageUrl = uploadedFile ? uploadedFile.path : sanitized.image || "";
    return await collectionRepository.create({ ...sanitized, image: imageUrl });
  }

  async updateCollection(id, data, uploadedFile) {
    const existing = await collectionRepository.findByIdOrSlug(id);
    if (!existing) throw new ApiError(404, "Collection not found");

    const sanitized = this.sanitizeData(data);
    if (uploadedFile) sanitized.image = uploadedFile.path;

    return await collectionRepository.update(existing._id, sanitized);
  }

  async deleteCollection(id) {
    const deleted = await collectionRepository.delete(id);
    if (!deleted) throw new ApiError(404, "Collection not found");
    return deleted;
  }
}

module.exports = new CollectionService();
