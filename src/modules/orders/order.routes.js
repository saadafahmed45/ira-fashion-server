const express = require("express");
const orderController = require("./order.controller");
const { verifyToken, requireAdmin } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router
  .route("/")
  .get(verifyToken, orderController.getOrders)
  .post(orderController.createOrder); // Guest or logged-in checkout

// Public order tracking (no auth needed)
router.get("/track/:orderNumber", orderController.trackOrder);

router.route("/:id").get(verifyToken, orderController.getOrderById);

router.route("/:id/status").patch(verifyToken, requireAdmin, orderController.updateOrderStatus);

// Admin delete/cancel an order
router.route("/:id").delete(verifyToken, requireAdmin, orderController.deleteOrder);

module.exports = router;
