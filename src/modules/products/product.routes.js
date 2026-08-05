const express = require("express");
const productController = require("./product.controller");
const { verifyToken, requireAdmin } = require("../../common/middleware/auth.middleware");
const upload = require("../../common/middleware/upload.middleware");

const router = express.Router();

router
  .route("/")
  .get(productController.getProducts)
  .post(verifyToken, requireAdmin, upload.array("images", 10), productController.createProduct);

router
  .route("/:id")
  .get(productController.getProductById)
  .put(verifyToken, requireAdmin, upload.array("images", 10), productController.updateProduct)
  .delete(verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
