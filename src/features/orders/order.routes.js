const express = require("express");
const { createOrder, getOrderById, updateOrderStatus } = require("./order.controller");
const { verifyToken, requireAdmin } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { createOrderSchema, updateOrderStatusSchema } = require("./order.validation");
const { authLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

// Guest checkout — anyone can place an order. If a valid token is present,
// the order is linked to that user. If not, the order is anonymous.
router.post("/", authLimiter, validate(createOrderSchema), createOrder);

// User or admin can check order details
router.get("/:id", verifyToken, getOrderById);

// Admin can update status
router.patch("/:id/status", verifyToken, requireAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
