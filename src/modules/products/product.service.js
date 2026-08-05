const productRepository = require("./product.repository");
const Collection = require("../collections/collection.model");
const ApiError = require("../../common/errors/ApiError");

function sanitizeProductData(rawData) {
  const data = { ...rawData };

  // 1. Sanitize & parse variants if sent as JSON string via FormData
  if (typeof data.variants === "string") {
    try {
      data.variants = JSON.parse(data.variants);
    } catch {
      data.variants = [];
    }
  }
  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map((v) => ({
      name: v.name || `${v.size || ""} ${v.color || ""}`.trim() || "Default Variant",
      price: Number(v.price) || 0,
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
      stock: Number(v.stock) || 0,
      sku: v.sku || "",
      options: v.options || {},
    }));
  }

  // 2. Sanitize & parse options if sent as JSON string
  if (typeof data.options === "string") {
    try {
      data.options = JSON.parse(data.options);
    } catch {
      data.options = [];
    }
  }

  // 3. Sanitize collectionIds & remove invalid empty string ObjectIds
  if (typeof data.collectionIds === "string") {
    try {
      data.collectionIds = JSON.parse(data.collectionIds);
    } catch {
      data.collectionIds = data.collectionIds.split(",").map((s) => s.trim());
    }
  }
  if (Array.isArray(data.collectionIds)) {
    data.collectionIds = data.collectionIds.filter(
      (id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)
    );
  } else {
    delete data.collectionIds;
  }

  // 4. Sanitize tags
  if (typeof data.tags === "string") {
    try {
      data.tags = JSON.parse(data.tags);
    } catch {
      data.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  // 5. Coerce numeric fields
  if (data.price !== undefined && data.price !== null) {
    data.price = Number(data.price);
  }
  if (data.compareAtPrice) {
    data.compareAtPrice = Number(data.compareAtPrice);
  }
  if (data.weight) {
    data.weight = Number(data.weight);
  }

  return data;
}

class ProductService {
  async getAllProducts(queryParams) {
    return await productRepository.findAll(queryParams);
  }

  async getProductByIdOrSlug(idOrSlug) {
    const product = await productRepository.findByIdOrSlug(idOrSlug);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  }

  async createProduct(productData, uploadedFiles = []) {
    const sanitizedData = sanitizeProductData(productData);
    const imageUrls = uploadedFiles.map((f) => f.path);

    const data = {
      ...sanitizedData,
      ...(imageUrls.length > 0 && { images: imageUrls }),
    };

    const product = await productRepository.create(data);

    // Sync product to collections if collectionIds specified
    if (product.collectionIds?.length > 0) {
      await Collection.updateMany(
        { _id: { $in: product.collectionIds } },
        { $addToSet: { productIds: product._id } }
      );
    }

    return product;
  }

  async updateProduct(id, productData, uploadedFiles = []) {
    const existingProduct = await productRepository.findByIdOrSlug(id);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    const sanitizedData = sanitizeProductData(productData);
    const uploadedImages = uploadedFiles.map((f) => f.path);
    const updatedData = { ...sanitizedData };

    if (uploadedImages.length > 0) {
      updatedData.images = [...(existingProduct.images || []), ...uploadedImages];
    }

    const oldCollectionIds = (existingProduct.collectionIds || []).map((cId) =>
      cId._id ? cId._id.toString() : cId.toString()
    );
    const newCollectionIds = (sanitizedData.collectionIds || []).map((cId) => cId.toString());

    const collectionsToAdd = newCollectionIds.filter((cId) => !oldCollectionIds.includes(cId));
    const collectionsToRemove = oldCollectionIds.filter((cId) => !newCollectionIds.includes(cId));

    const updatedProduct = await productRepository.update(existingProduct._id, updatedData);

    // Sync collection references
    if (collectionsToAdd.length > 0) {
      await Collection.updateMany({ _id: { $in: collectionsToAdd } }, { $addToSet: { productIds: existingProduct._id } });
    }
    if (collectionsToRemove.length > 0) {
      await Collection.updateMany({ _id: { $in: collectionsToRemove } }, { $pull: { productIds: existingProduct._id } });
    }

    return updatedProduct;
  }

  async deleteProduct(id) {
    const product = await productRepository.delete(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    await Collection.updateMany({ productIds: id }, { $pull: { productIds: id } });
    return product;
  }
}

module.exports = new ProductService();
