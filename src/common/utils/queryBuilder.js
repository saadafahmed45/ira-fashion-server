class QueryBuilder {
  constructor(model, queryParams) {
    this.model = model;
    this.queryParams = queryParams;
    this.query = {};
    this.sort = { createdAt: -1 };
    this.page = Math.max(1, parseInt(queryParams.page) || 1);
    this.limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 12));
    this.fields = "";
    this.populateFields = [];
  }

  search(searchableFields = []) {
    if (this.queryParams.search && searchableFields.length > 0) {
      const searchTerm = this.queryParams.search.trim();
      const searchRegex = new RegExp(searchTerm, "i");
      this.query.$or = searchableFields.map((field) => ({
        [field]: searchRegex,
      }));
    }
    return this;
  }

  filterByFields(allowedFields = []) {
    allowedFields.forEach((field) => {
      if (this.queryParams[field] !== undefined && this.queryParams[field] !== "") {
        const val = this.queryParams[field];
        if (typeof val === "string" && val.includes(",")) {
          this.query[field] = { $in: val.split(",") };
        } else {
          this.query[field] = val;
        }
      }
    });

    // Price range filters
    if (this.queryParams.minPrice || this.queryParams.maxPrice) {
      this.query.price = {};
      if (this.queryParams.minPrice) {
        this.query.price.$gte = Number(this.queryParams.minPrice);
      }
      if (this.queryParams.maxPrice) {
        this.query.price.$lte = Number(this.queryParams.maxPrice);
      }
    }

    return this;
  }

  sortQuery() {
    if (this.queryParams.sort) {
      const sortFields = this.queryParams.sort.split(",");
      const sortObj = {};
      sortFields.forEach((field) => {
        if (field.startsWith("-")) {
          sortObj[field.substring(1)] = -1;
        } else {
          sortObj[field] = 1;
        }
      });
      this.sort = sortObj;
    }
    return this;
  }

  selectFields() {
    if (this.queryParams.fields) {
      this.fields = this.queryParams.fields.split(",").join(" ");
    }
    return this;
  }

  populate(fields) {
    if (Array.isArray(fields)) {
      this.populateFields = fields;
    } else if (fields) {
      this.populateFields = [fields];
    }
    return this;
  }

  async execute() {
    this.sortQuery();
    this.selectFields();

    const skip = (this.page - 1) * this.limit;
    const total = await this.model.countDocuments(this.query);
    const totalPages = Math.ceil(total / this.limit) || 1;

    let dbQuery = this.model.find(this.query).sort(this.sort).skip(skip).limit(this.limit);

    if (this.fields) {
      dbQuery = dbQuery.select(this.fields);
    }

    if (this.populateFields.length > 0) {
      this.populateFields.forEach((pop) => {
        dbQuery = dbQuery.populate(pop);
      });
    }

    const data = await dbQuery;

    return {
      data,
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages,
        hasNextPage: this.page < totalPages,
        hasPrevPage: this.page > 1,
      },
    };
  }
}

module.exports = QueryBuilder;
