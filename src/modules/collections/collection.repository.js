const Collection = require("./collection.model");
const QueryBuilder = require("../../common/utils/queryBuilder");

class CollectionRepository {
  async findAll(queryParams) {
    const builder = new QueryBuilder(Collection, queryParams);
    return await builder.search(["name", "description"]).filterByFields(["status"]).execute();
  }

  async findByIdOrSlug(idOrSlug) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    if (isObjectId) {
      return await Collection.findById(idOrSlug).populate("productIds");
    }
    return await Collection.findOne({ slug: idOrSlug }).populate("productIds");
  }

  async create(data) {
    const collection = new Collection(data);
    return await collection.save();
  }

  async update(id, data) {
    return await Collection.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Collection.findByIdAndDelete(id);
  }
}

module.exports = new CollectionRepository();
