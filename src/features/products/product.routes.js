const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("./product.controller");
const { verifyToken, requireAdmin } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");
const validate = require("../../middleware/validate.middleware");
const { createProductSchema, updateProductSchema } = require("./product.validation");
const { apiLimiter, authLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

// Public routes (Rate limited to avoid scraping)
router.get("/", apiLimiter, getProducts);
router.get("/:id", apiLimiter, getProductById);

// Admin operations (Rate limited to avoid flooding uploads)
router.post(
  "/",
  verifyToken,
  requireAdmin,
  authLimiter,
  upload.array("images", 5),
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  authLimiter,
  upload.array("images", 5),
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id", verifyToken, requireAdmin, authLimiter, deleteProduct);

module.exports = router;
