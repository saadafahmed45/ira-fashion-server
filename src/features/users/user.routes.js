const express = require("express");
const { getMe, updateMe, getMyOrders } = require("./user.controller");
const { verifyToken } = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken); // All user routes require authorization

router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/me/orders", getMyOrders);

module.exports = router;
