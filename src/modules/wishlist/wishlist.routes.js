const express = require("express");
const wishlistController = require("./wishlist.controller");
const { verifyToken } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.route("/").get(wishlistController.getWishlist).post(wishlistController.addToWishlist);
router.route("/:productId").delete(wishlistController.removeFromWishlist);

module.exports = router;
