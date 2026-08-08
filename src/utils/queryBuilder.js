/**
 * A helper to build Mongoose queries for pagination, sorting, search, and filtering.
 */
class QueryBuilder {
  constructor(model, queryParams) {
    this.model = model;
    this.queryParams = queryParams;
    this.query = null; // mongoose query object
    this.filter = {};  // mongo filter object
  }

  // 1. Full-text search or title regex search
  search(fields = ["title", "description"]) {
    if (this.queryParams.search) {
      const searchRegex = new RegExp(this.queryParams.search, "i");
      const searchConditions = fields.map((field) => ({
        [field]: searchRegex,
      }));
      this.filter = { ...this.filter, $or: searchConditions };
    }
    return this;
  }

  // 2. Strict key-value filtering
  filterByFields(allowedFields = []) {
    const filters = {};
    allowedFields.forEach((field) => {
      if (this.queryParams[field] !== undefined) {
        // Handle comma-separated filter values (e.g., status=active,draft)
        if (typeof this.queryParams[field] === "string" && this.queryParams[field].includes(",")) {
          filters[field] = { $in: this.queryParams[field].split(",") };
        } else {
          filters[field] = this.queryParams[field];
        }
      }
    });

    // Special range checking for numeric values (e.g. minPrice, maxPrice)
    if (this.queryParams.minPrice || this.queryParams.maxPrice) {
      filters.price = {};
      if (this.queryParams.minPrice) {
        filters.price.$gte = Number(this.queryParams.minPrice);
      }
      if (this.queryParams.maxPrice) {
        filters.price.$lte = Number(this.queryParams.maxPrice);
      }
    }

    this.filter = { ...this.filter, ...filters };
    return this;
  }

  // 3. Select specific fields for small API payload
  selectFields(fields) {
    if (fields) {
      this.selectedFields = Array.isArray(fields) ? fields.join(" ") : fields;
    }
    return this;
  }

  // 4. Sorting query builder
  sort() {
    if (this.query) {
      if (this.queryParams.sort) {
        // Format: ?sort=price,-createdAt
        const sortBy = this.queryParams.sort.split(",").join(" ");
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort("-createdAt"); // default sort
      }
    }
    return this;
  }

  // Execute query with paginated response
  async execute() {
    const page = Math.max(Number(this.queryParams.page) || 1, 1);
    const limit = Math.max(Number(this.queryParams.limit) || 12, 1);
    const skip = (page - 1) * limit;

    // Start with the filtered query
    this.query = this.model.find(this.filter);

    // Apply field selection if specified
    if (this.selectedFields) {
      this.query = this.query.select(this.selectedFields);
    }

    // Apply sort
    this.sort();

    // Clone query for counting total documents
    const totalDocs = await this.model.countDocuments(this.filter);

    // Apply pagination and lean execution
    this.query = this.query.skip(skip).limit(limit).lean();

    // Run query
    const data = await this.query;

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total: totalDocs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = QueryBuilder;
