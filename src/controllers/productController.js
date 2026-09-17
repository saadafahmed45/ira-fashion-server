const Product = require("../models/Product");
const Category = require("../models/Category");
const ErrorResponse = require("../utils/errorResponse");
const slugify = require("slugify");

// @desc    Get all products with search, filter, sort & pagination
// @route   GET /api/v1/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      status,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // By default only return active products for storefront
    if (status) {
      query.status = status;
    } else {
      query.status = "active";
    }

    // Search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter (slug or ObjectId)
    if (category) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      if (isObjectId) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category });
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          // Category slug not found -> return empty
          return res.status(200).json({
            success: true,
            data: [],
            meta: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 },
          });
        }
      }
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // In-stock
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Featured
    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    } else if (sort === "rating") {
      sortOption = { ratings: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by id or slug
// @route   GET /api/v1/products/:idOrSlug
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const product = await Product.findOne(query).populate("category", "name slug");

    if (!product) {
      return next(new ErrorResponse("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      stock,
      images,
      isFeatured,
      status,
    } = req.body;

    if (!name || !description || price === undefined || !category) {
      return next(new ErrorResponse("Please provide name, description, price and category", 400));
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return next(new ErrorResponse("Invalid category specified", 400));
    }

    // Handle images array or uploaded files
    let productImages = [];
    if (req.files && req.files.length > 0) {
      productImages = req.files.map((file) => file.path);
    } else if (Array.isArray(images)) {
      productImages = images;
    } else if (typeof images === "string") {
      productImages = [images];
    }

    const slug =
      slugify(name, { lower: true, strict: true }) + "-" + Math.floor(1000 + Math.random() * 9000);

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      category,
      brand: brand || "Ira Fashion",
      stock: stock !== undefined ? Number(stock) : 0,
      images: productImages.length > 0 ? productImages : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"],
      isFeatured: isFeatured === true || isFeatured === "true",
      status: status || "active",
    });

    const populated = await Product.findById(product._id).populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse("Product not found", 404));
    }

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      stock,
      images,
      isFeatured,
      status,
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (stock !== undefined) product.stock = Number(stock);
    if (isFeatured !== undefined) product.isFeatured = isFeatured === true || isFeatured === "true";
    if (status) product.status = status;

    if (req.files && req.files.length > 0) {
      product.images = req.files.map((file) => file.path);
    } else if (images) {
      product.images = Array.isArray(images) ? images : [images];
    }

    await product.save();
    const populated = await Product.findById(product._id).populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse("Product not found", 404));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
