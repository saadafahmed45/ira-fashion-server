const express = require("express");
const authController = require("./auth.controller");
const { verifyToken } = require("../../common/middleware/auth.middleware");
const { authLimiter } = require("../../common/middleware/rateLimit.middleware");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/google", authLimiter, authController.googleAuth);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getMe);

module.exports = router;
