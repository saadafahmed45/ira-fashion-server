const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.route("/")
  .get(getProducts)
  .post(protect, admin, upload.array("images", 6), createProduct);

router.route("/:idOrSlug")
  .get(getProduct)
  .put(protect, admin, upload.array("images", 6), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
