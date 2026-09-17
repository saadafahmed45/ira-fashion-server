const express = require("express");
const {
  getProfile,
  updateProfile,
  getWishlist,
  toggleWishlist,
  getUsers,
  updateUserStatus,
  updateUserRole,
  assignAdminRole,
  getDashboardMetrics,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // All user routes require login

router.route("/profile")
  .get(getProfile)
  .put(updateProfile);

router.route("/wishlist")
  .get(getWishlist);

router.post("/wishlist/:productId", toggleWishlist);

// Admin routes
router.get("/", admin, getUsers);
router.post("/assign-admin", admin, assignAdminRole);
router.put("/:id/status", admin, updateUserStatus);
router.put("/:id/role", admin, updateUserRole);
router.get("/admin/analytics", admin, getDashboardMetrics);

module.exports = router;
