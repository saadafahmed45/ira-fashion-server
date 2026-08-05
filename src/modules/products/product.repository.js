const Product = require("./product.model");
const QueryBuilder = require("../../common/utils/queryBuilder");

class ProductRepository {
  async findAll(queryParams) {
    const allowedFilters = ["status", "productType", "vendor", "collectionIds"];
    const builder = new QueryBuilder(Product, queryParams);

    return await builder
      .search(["title", "description", "vendor", "productType"])
      .filterByFields(allowedFilters)
      .populate("collectionIds")
      .execute();
  }

  async findByIdOrSlug(idOrSlug) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    if (isObjectId) {
      return await Product.findById(idOrSlug).populate("collectionIds", "name slug");
    }
    return await Product.findOne({ slug: idOrSlug }).populate("collectionIds", "name slug");
  }

  async create(data) {
    const product = new Product(data);
    return await product.save();
  }

  async update(id, data) {
    return await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await Product.countDocuments(query);
  }
}

module.exports = new ProductRepository();
