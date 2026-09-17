const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/generateTokens");

const getAdminEmails = () => {
  const envEmails = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ErrorResponse("Please provide name, email and password", 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new ErrorResponse("An account with this email already exists", 400));
    }

    // Auto-grant admin if email matches ADMIN_EMAIL env list
    const role = isAdminEmail(email) ? "admin" : "user";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          addresses: user.addresses,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse("Please provide email and password", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    if (user.status === "blocked") {
      return next(new ErrorResponse("Your account has been suspended", 403));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Check if email matches ADMIN_EMAIL list and elevate role if needed
    if (isAdminEmail(user.email) && user.role !== "admin") {
      user.role = "admin";
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          addresses: user.addresses,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token using httpOnly refreshToken cookie or body
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return next(new ErrorResponse("No refresh token provided", 401));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearRefreshTokenCookie(res);
      return next(new ErrorResponse("Refresh token expired or invalid", 401));
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.status === "blocked") {
      clearRefreshTokenCookie(res);
      return next(new ErrorResponse("User invalid or suspended", 401));
    }

    // Generate new access token and rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          addresses: user.addresses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & invalidate cookies
// @route   POST /api/v1/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
      } catch {
        // Continue logout even if token already invalid
      }
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login / register
// @route   POST /api/v1/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { idToken, email, name, photoURL, firebaseUid } = req.body;

    let userEmail = email ? email.toLowerCase().trim() : "";
    let userName = name || "";
    let userPhoto = photoURL || "";
    let userUid = firebaseUid || "";

    // If idToken is provided, decode payload to extract claims
    if (idToken) {
      try {
        const decoded = jwt.decode(idToken);
        if (decoded) {
          if (decoded.email) userEmail = decoded.email.toLowerCase().trim();
          if (decoded.name) userName = decoded.name;
          if (decoded.picture) userPhoto = decoded.picture;
          if (decoded.user_id || decoded.sub || decoded.uid) {
            userUid = decoded.user_id || decoded.sub || decoded.uid;
          }
        }
      } catch {
        // Fallback to body properties
      }
    }

    if (!userEmail) {
      return next(new ErrorResponse("Unable to authenticate: email not provided by Google", 400));
    }

    let user = await User.findOne({ email: userEmail });

    const role = isAdminEmail(userEmail) ? "admin" : "user";

    if (!user) {
      // Create new user with Google profile
      const randomPassword = crypto.randomBytes(24).toString("hex") + "!Aa1";
      user = await User.create({
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        password: randomPassword,
        role,
        photoURL: userPhoto,
        firebaseUid: userUid,
      });
    } else {
      let needsSave = false;
      if (isAdminEmail(userEmail) && user.role !== "admin") {
        user.role = "admin";
        needsSave = true;
      }
      if (userPhoto && user.photoURL !== userPhoto) {
        user.photoURL = userPhoto;
        needsSave = true;
      }
      if (userUid && user.firebaseUid !== userUid) {
        user.firebaseUid = userUid;
        needsSave = true;
      }
      if (needsSave) {
        await user.save({ validateBeforeSave: false });
      }
    }

    if (user.status === "blocked") {
      return next(new ErrorResponse("Your account has been suspended", 403));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Authenticated via Google successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photoURL: user.photoURL,
          status: user.status,
          addresses: user.addresses,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
};
