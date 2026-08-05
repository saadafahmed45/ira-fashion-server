const express = require("express");
const adminController = require("./admin.controller");
const { verifyToken, requireAdmin } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/analytics", adminController.getAnalytics);

module.exports = router;
