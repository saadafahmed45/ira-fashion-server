const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Create new order (COD-first)
// @route   POST /api/v1/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = "COD",
      couponCode,
      notes,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return next(new ErrorResponse("No order items provided", 400));
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
      return next(new ErrorResponse("Please provide complete shipping address including street, city, and phone", 400));
    }

    // Enforce COD strict validation
    if (paymentMethod !== "COD") {
      return next(new ErrorResponse("Online payment methods are coming soon. Please select Cash on Delivery.", 400));
    }

    // Verify inventory and calculate authentic server prices
    let itemsPrice = 0;
    const validatedOrderItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new ErrorResponse(`Product not found for id ${item.product}`, 404));
      }

      if (product.status !== "active") {
        return next(new ErrorResponse(`Product '${product.name}' is not currently available for purchase`, 400));
      }

      if (product.stock < item.quantity) {
        return next(
          new ErrorResponse(
            `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}`,
            400
          )
        );
      }

      const activePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      itemsPrice += activePrice * item.quantity;

      validatedOrderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: activePrice,
        quantity: item.quantity,
      });
    }

    // Validate coupon if provided
    let discountAmount = 0;
    let couponAppliedId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      });

      if (coupon && new Date() <= new Date(coupon.expiryDate) && itemsPrice >= coupon.minPurchase) {
        couponAppliedId = coupon._id;
        if (coupon.discountType === "percentage") {
          discountAmount = (itemsPrice * coupon.amount) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = Math.min(coupon.amount, itemsPrice);
        }
      }
    }

    // Shipping calculation: e.g. Free shipping over ৳2000, else ৳70
    const shippingPrice = itemsPrice >= 2000 ? 0 : 70;
    const taxPrice = 0;
    const totalPrice = Math.max(0, itemsPrice + shippingPrice + taxPrice - discountAmount);

    // Create the order
    const order = await Order.create({
      user: req.user._id,
      orderItems: validatedOrderItems,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || "",
        zip: shippingAddress.zip || "",
        country: shippingAddress.country || "Bangladesh",
        phone: shippingAddress.phone,
      },
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Pending",
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      shippingPrice,
      taxPrice,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      couponApplied: couponAppliedId,
      notes,
    });

    // Decrement stock for purchased products
    for (const item of validatedOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully with Cash on Delivery",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("orderItems.product", "name images slug"),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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

// @desc    Get order by id
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("couponApplied", "code discountType amount");

    if (!order) {
      return next(new ErrorResponse("Order not found", 404));
    }

    // Verify ownership or admin access
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return next(new ErrorResponse("Not authorized to view this order", 403));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search) {
      query.$or = [
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { "shippingAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse("Order not found", 404));
    }

    // Handle cancellation: restore inventory
    if (orderStatus === "Cancelled" && order.orderStatus !== "Cancelled") {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === "Delivered") {
        order.deliveredAt = new Date();
        if (order.paymentMethod === "COD") {
          order.paymentStatus = "Paid";
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${order.orderStatus}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
