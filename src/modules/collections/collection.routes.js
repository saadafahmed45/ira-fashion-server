const express = require("express");
const collectionController = require("./collection.controller");
const { verifyToken, requireAdmin } = require("../../common/middleware/auth.middleware");
const upload = require("../../common/middleware/upload.middleware");

const router = express.Router();

router
  .route("/")
  .get(collectionController.getCollections)
  .post(verifyToken, requireAdmin, upload.single("image"), collectionController.createCollection);

router
  .route("/:id")
  .get(collectionController.getCollectionById)
  .put(verifyToken, requireAdmin, upload.single("image"), collectionController.updateCollection)
  .delete(verifyToken, requireAdmin, collectionController.deleteCollection);

module.exports = router;
