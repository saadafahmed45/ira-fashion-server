const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // All order routes require authentication

router.route("/")
  .post(createOrder)
  .get(admin, getAllOrders);

router.get("/my-orders", getMyOrders);

router.route("/:id")
  .get(getOrderById);

router.put("/:id/status", admin, updateOrderStatus);

module.exports = router;
