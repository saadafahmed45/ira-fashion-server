const express = require("express");
const {
  createReview,
  getProductReviews,
  getAllReviews,
  toggleReviewApproval,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .post(protect, createReview)
  .get(protect, admin, getAllReviews);

router.get("/product/:productId", getProductReviews);

router.put("/:id/approval", protect, admin, toggleReviewApproval);
router.delete("/:id", protect, deleteReview);

module.exports = router;
