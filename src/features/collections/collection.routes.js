const express = require("express");
const {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("./collection.controller");
const { verifyToken, requireAdmin } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");
const validate = require("../../middleware/validate.middleware");
const { createCollectionSchema, updateCollectionSchema } = require("./collection.validation");
const { apiLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

router.get("/", apiLimiter, getCollections);
router.get("/:id", apiLimiter, getCollectionById);

// Admin dashboard routes
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  validate(createCollectionSchema),
  createCollection
);

router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  validate(updateCollectionSchema),
  updateCollection
);

router.delete("/:id", verifyToken, requireAdmin, deleteCollection);

module.exports = router;
