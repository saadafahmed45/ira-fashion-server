const authService = require("./auth.service");
const ApiResponse = require("../../common/utils/apiResponse");
const asyncHandler = require("../../common/utils/asyncHandler");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  res.cookie("token", token, cookieOptions);
  return ApiResponse.success(res, { user, token }, "Registered successfully", 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.loginWithEmail(email, password);
  res.cookie("token", token, cookieOptions);
  return ApiResponse.success(res, { user, token }, "Logged in successfully");
});

const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const { user, token } = await authService.firebaseGoogleLogin(idToken);
  res.cookie("token", token, cookieOptions);
  return ApiResponse.success(res, { user, token }, "Authenticated via Google successfully");
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);
  return ApiResponse.success(res, null, "Logged out successfully");
});

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user, "Current user fetched");
});

module.exports = {
  register,
  login,
  googleAuth,
  logout,
  getMe,
};
