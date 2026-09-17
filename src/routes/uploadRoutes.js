const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { protect, admin } = require("../middleware/authMiddleware");
const ErrorResponse = require("../utils/errorResponse");

const router = express.Router();

// @desc    Upload single image to Cloudinary
// @route   POST /api/v1/upload/single
// @access  Private/Admin
router.post(
  "/single",
  protect,
  admin,
  upload.single("image"),
  (req, res, next) => {
    if (!req.file) {
      return next(new ErrorResponse("Please upload an image file", 400));
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully to Cloudinary",
      data: {
        url: req.file.path,
        filename: req.file.filename,
      },
    });
  }
);

// @desc    Upload multiple images to Cloudinary (up to 10)
// @route   POST /api/v1/upload/multiple
// @access  Private/Admin
router.post(
  "/multiple",
  protect,
  admin,
  upload.array("images", 10),
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse("Please upload at least one image file", 400));
    }

    const urls = req.files.map((file) => file.path);

    res.status(200).json({
      success: true,
      message: `${urls.length} images uploaded successfully to Cloudinary`,
      data: {
        urls,
      },
    });
  }
);

module.exports = router;
