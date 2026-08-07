const Collection = require("./collection.model");
const QueryBuilder = require("../../common/utils/queryBuilder");

class CollectionRepository {
  async findAll(queryParams) {
    const builder = new QueryBuilder(Collection, queryParams);
    return await builder.search(["name", "description"]).filterByFields(["status"]).execute();
  }

  async findByIdOrSlug(idOrSlug) {
    const slugify = require("slugify");
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    let collection = null;

    if (isObjectId) {
      collection = await Collection.findById(idOrSlug).populate("productIds");
    }

    if (!collection) {
      collection = await Collection.findOne({ slug: idOrSlug }).populate("productIds");
    }

    if (!collection) {
      const allCollections = await Collection.find().populate("productIds");
      const targetSlug = slugify(idOrSlug, { lower: true, strict: true });
      collection = allCollections.find(
        (c) =>
          c.slug === idOrSlug ||
          (c.name && slugify(c.name, { lower: true, strict: true }) === targetSlug)
      );
    }

    return collection;
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
