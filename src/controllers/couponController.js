const Coupon = require("../models/Coupon");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Validate coupon code and calculate discount
// @route   POST /api/v1/coupons/validate
// @access  Public
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code) {
      return next(new ErrorResponse("Coupon code is required", 400));
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return next(new ErrorResponse("Invalid or inactive coupon code", 400));
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return next(new ErrorResponse("This coupon code has expired", 400));
    }

    const purchaseAmount = Number(subtotal);
    if (purchaseAmount < coupon.minPurchase) {
      return next(
        new ErrorResponse(
          `Minimum order amount of ৳${coupon.minPurchase} required for this coupon`,
          400
        )
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (purchaseAmount * coupon.amount) / 100;
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        calculatedDiscount = coupon.maxDiscount;
      }
    } else {
      // Fixed discount
      calculatedDiscount = Math.min(coupon.amount, purchaseAmount);
    }

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully`,
      data: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        amount: coupon.amount,
        calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, amount, minPurchase, maxDiscount, expiryDate, isActive } = req.body;

    if (!code || !discountType || amount === undefined || !expiryDate) {
      return next(new ErrorResponse("Code, discount type, amount and expiry date are required", 400));
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return next(new ErrorResponse("Coupon with this code already exists", 400));
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      amount: Number(amount),
      minPurchase: minPurchase ? Number(minPurchase) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return next(new ErrorResponse("Coupon not found", 404));
    }

    const { code, discountType, amount, minPurchase, maxDiscount, expiryDate, isActive } = req.body;

    if (code) coupon.code = code.trim().toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (amount !== undefined) coupon.amount = Number(amount);
    if (minPurchase !== undefined) coupon.minPurchase = Number(minPurchase);
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return next(new ErrorResponse("Coupon not found", 404));
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
