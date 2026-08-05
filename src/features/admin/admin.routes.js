const express = require("express");
const {
  getStats,
  getAdminOrders,
  getAdminCustomers,
  updateCustomerRole,
  getAdminCoupons,
  createAdminCoupon,
  getAdminReviews,
  updateReviewStatus,
} = require("./admin.controller");
const { verifyToken, requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);
router.use(requireAdmin); // Require global admin permissions for all routes in this file

router.get("/stats", getStats);
router.get("/orders", getAdminOrders);
router.get("/customers", getAdminCustomers);
router.put("/customers/:id/role", updateCustomerRole);
router.get("/coupons", getAdminCoupons);
router.post("/coupons", createAdminCoupon);
router.get("/reviews", getAdminReviews);
router.put("/reviews/:id", updateReviewStatus);

module.exports = router;
