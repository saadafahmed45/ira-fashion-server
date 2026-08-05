const express = require("express");
const { validateCoupon } = require("./coupon.controller");
const { verifyToken } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/validate", verifyToken, validateCoupon);

module.exports = router;
