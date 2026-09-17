const { verifyAccessToken } = require("../utils/generateTokens");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized, no access token provided", 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ErrorResponse("User belonging to this token no longer exists", 401));
    }

    if (user.status === "blocked") {
      return next(new ErrorResponse("Your account has been suspended", 403));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized, token invalid or expired", 401));
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return next(new ErrorResponse("Access denied: Admin privileges required", 403));
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.status !== "blocked") {
        req.user = user;
      }
    } catch {
      // Continue without user
    }
  }
  next();
};

module.exports = {
  protect,
  admin,
  optionalAuth,
};
