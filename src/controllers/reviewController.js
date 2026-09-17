const Review = require("../models/Review");
const Product = require("../models/Product");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Add review for a product
// @route   POST /api/v1/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body;

    if (!product || !rating || !comment) {
      return next(new ErrorResponse("Product, rating and comment are required", 400));
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return next(new ErrorResponse("Product not found", 404));
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      product,
      user: req.user._id,
    });

    if (existingReview) {
      return next(new ErrorResponse("You have already reviewed this product", 400));
    }

    const review = await Review.create({
      product,
      user: req.user._id,
      rating: Number(rating),
      comment,
      isApproved: true,
    });

    const populated = await Review.findById(review._id).populate("user", "name");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId, isApproved: true })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ product: productId, isApproved: true }),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews
// @access  Private/Admin
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, isApproved } = req.query;
    const query = {};

    if (isApproved !== undefined) {
      query.isApproved = isApproved === "true";
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("user", "name email")
        .populate("product", "name images slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle review approval (Admin)
// @route   PUT /api/v1/reviews/:id/approval
// @access  Private/Admin
const toggleReviewApproval = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new ErrorResponse("Review not found", 404));
    }

    review.isApproved = !review.isApproved;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review approval set to ${review.isApproved}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new ErrorResponse("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return next(new ErrorResponse("Not authorized to delete this review", 403));
    }

    await Review.findOneAndDelete({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getAllReviews,
  toggleReviewApproval,
  deleteReview,
};
