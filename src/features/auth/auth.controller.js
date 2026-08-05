const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const JWT_SECRET = process.env.JWT_SECRET || "ira_fashion_jwt_secret_change_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

const syncUser = asyncHandler(async (req, res) => {
  const { uid, email, name, photoURL } = req.body;

  if (!uid || !email) {
    return ApiResponse.error(res, "Firebase UID and email are required", 400);
  }

  let user = await User.findOne({ firebaseUid: uid });

  const role = email.toLowerCase() === ADMIN_EMAIL ? "admin" : "customer";

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      email,
      name: name || "Customer",
      photoURL: photoURL || "",
      role,
    });
  } else {
    let modified = false;
    if (name && user.name !== name) {
      user.name = name;
      modified = true;
    }
    if (photoURL && user.photoURL !== photoURL) {
      user.photoURL = photoURL;
      modified = true;
    }
    if (user.role !== role) {
      user.role = role;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  }

  const token = jwt.sign(
    { id: user._id, firebaseUid: user.firebaseUid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  // Write session token to HttpOnly cookie — prevents XSS token theft
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(res, {
    _id: user._id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    role: user.role,
    token, // also returned in body for client-side localStorage fallback
  }, "User synced successfully", 200);
});

const makeAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return ApiResponse.error(res, "Email is required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return ApiResponse.error(res, "User not found. Sign in first.", 404);
  }

  user.role = "admin";
  await user.save();

  const token = jwt.sign(
    { id: user._id, firebaseUid: user.firebaseUid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  // Refresh session cookie with new admin-level token
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    _id: user._id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    role: user.role,
    token,
  }, "User promoted to admin", 200);
});

/**
 * Logout — clears the HttpOnly session cookie from the browser
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return ApiResponse.success(res, null, "Logged out successfully", 200);
});

module.exports = {
  syncUser,
  makeAdmin,
  logout,
};
