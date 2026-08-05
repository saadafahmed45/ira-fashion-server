const express = require("express");
const { getWishlist, toggleWishlist } = require("./wishlist.controller");
const { verifyToken } = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken); // All wishlist routes require token

router.get("/", getWishlist);
router.post("/:productId", toggleWishlist);

module.exports = router;
