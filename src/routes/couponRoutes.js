const express = require("express");
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validate", validateCoupon);

router.route("/")
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.route("/:id")
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

module.exports = router;
