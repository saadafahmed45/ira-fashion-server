const Category = require("../models/Category");
const Product = require("../models/Product");
const ErrorResponse = require("../utils/errorResponse");
const slugify = require("slugify");

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { isActive: true };

    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by slug or id
// @route   GET /api/v1/categories/:slugOrId
// @access  Public
const getCategory = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

    const category = isObjectId
      ? await Category.findById(slugOrId)
      : await Category.findOne({ slug: slugOrId });

    if (!category) {
      return next(new ErrorResponse("Category not found", 404));
    }

    const productCount = await Product.countDocuments({
      category: category._id,
      status: "active",
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, isActive } = req.body;

    if (!name) {
      return next(new ErrorResponse("Category name is required", 400));
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return next(new ErrorResponse("Category with this name or slug already exists", 400));
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, isActive } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse("Category not found", 404));
    }

    if (name && name !== category.name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new ErrorResponse("Category not found", 404));
    }

    // Check if any products use this category
    const count = await Product.countDocuments({ category: category._id });
    if (count > 0) {
      return next(
        new ErrorResponse(
          `Cannot delete category. ${count} products are currently assigned to this category.`,
          400
        )
      );
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
