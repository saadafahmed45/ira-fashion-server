const express = require("express");
const { getProductReviews, createReview } = require("./review.controller");
const { verifyToken } = require("../../middleware/auth.middleware");
const { apiLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

router.get("/:productId", apiLimiter, getProductReviews);
router.post("/", verifyToken, createReview);

module.exports = router;
