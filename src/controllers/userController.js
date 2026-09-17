const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & addresses
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, addresses } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (addresses && Array.isArray(addresses)) user.addresses = addresses;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wishlist
// @route   GET /api/v1/users/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      match: { status: "active" },
      populate: { path: "category", select: "name slug" },
    });

    res.status(200).json({
      success: true,
      data: user.wishlist || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product in wishlist (Add/Remove)
// @route   POST /api/v1/users/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.indexOf(productId);
    let action = "";

    if (index > -1) {
      user.wishlist.splice(index, 1);
      action = "removed";
    } else {
      user.wishlist.push(productId);
      action = "added";
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Product ${action} to wishlist`,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 15 } = req.query;
    const query = {};

    if (role) {
      if (role === "user" || role === "customer") {
        query.role = { $in: ["user", "customer"] };
      } else {
        query.role = role;
      }
    }
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

// @desc    Update user status (Admin)
// @route   PUT /api/v1/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & analytics (Admin)
// @route   GET /api/v1/users/admin/analytics
// @access  Private/Admin
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalCategories] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Category.countDocuments(),
    ]);

    // Calculate total revenue from non-cancelled orders
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Monthly revenue data for Recharts chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyDataAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthlyDataAgg.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Math.round(item.revenue),
      orders: item.orders,
    }));

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          totalProducts,
          totalUsers,
          totalCategories,
        },
        chartData,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign or create admin by email
// @route   POST /api/v1/users/assign-admin
// @access  Private/Admin
const assignAdminRole = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return next(new ErrorResponse("Please provide an email address", 400));
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.role = "admin";
      await user.save();
      return res.status(200).json({
        success: true,
        message: `User ${user.email} is now an Administrator`,
        data: user,
      });
    }

    // User doesn't exist yet: create them as admin with random password
    const crypto = require("crypto");
    const randomPassword = crypto.randomBytes(20).toString("hex") + "!Aa1";
    user = await User.create({
      name: name?.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
      password: randomPassword,
      role: "admin",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: `New account ${cleanEmail} created with Administrator role`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role with self-demotion prevention
// @route   PUT /api/v1/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return next(new ErrorResponse("Invalid role. Must be 'user' or 'admin'", 400));
    }

    // Prevent logged-in admin from revoking their own admin access
    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return next(new ErrorResponse("You cannot revoke your own administrator privileges", 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getWishlist,
  toggleWishlist,
  getUsers,
  updateUserStatus,
  updateUserRole,
  assignAdminRole,
  getDashboardMetrics,
};
